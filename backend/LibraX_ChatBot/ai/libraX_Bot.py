# libraX_Bot.py
import os
import re
import sys
import time
import traceback
import subprocess
import difflib
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from .env (make sure to NOT commit .env to git)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise Exception("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set (put them in .env)")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ---------- config ----------
MIN_CONFIDENCE = 0.30
SEARCH_RETRY_DELAY = 1.0
SEARCH_RETRY_COUNT = 2

keywords = [
    "book", "author", "isbn", "catalog", "borrow", "library",
    "reading", "reference", "return", "reserve", "renew",
    "fine", "due date", "shelf", "card", "dashboard", "subtitle",
    "description", "publication", "year", "edition", "language",
    "quantity", "copies", "available", "left", "have", "in stock",
    "how many", "still available", "is available", "availability", "status",
    "publisher", "genre"
]

inventory_keywords = [
    "availability", "status", "available", "still available", "in stock",
    "find", "borrow", "checkout", "is", "can i", "library"
]


# ---------- helpers ----------
def is_available_field(val):
    return val is not None and str(val).strip().upper() not in ("", "NONE", "NULL", "EMPTY")


class LibraryUtils:
    @staticmethod
    def is_library_keyword(prompt: str) -> bool:
        words = prompt.lower().split()
        for w in words:
            if difflib.get_close_matches(w, keywords, n=1, cutoff=0.7):
                return True
        return False

    @staticmethod
    def extract_book_name(prompt: str) -> str:
        ignore_words = [
            "when", "what", "year", "published", "date", "is", "was", "book",
            "the", "of", "who", "author", "in", "on", "and", "edition", "subtitle",
            "description", "language", "quantity", "publication", "copies",
            "available", "status", "publisher", "genre", "can i", "find",
            "borrow", "checkout", "library"
        ]
        cleaned = prompt.lower()
        for w in ignore_words:
            cleaned = re.sub(r'\b' + re.escape(w) + r'\b', '', cleaned)
        cleaned = cleaned.replace("?", "").replace(".", "").strip()
        # Prefer quoted title if user used quotes
        match = re.search(r'"(.+?)"', cleaned) or re.search(r"'(.+?)'", cleaned)
        if match:
            return match.group(1).strip().title()
        return cleaned.strip().title()

    @staticmethod
    def similar_match_score(a: str, b: str) -> float:
        return difflib.SequenceMatcher(None, (a or "").lower(), (b or "").lower()).ratio()

    @staticmethod
    def _safe_execute(query_fn):
        """
        helper to catch Postgrest exceptions that sometimes return HTML (Cloudflare 5xx).
        returns result or None on failure.
        """
        try:
            return query_fn()
        except Exception as e:
            # Log the full exception for debugging; caller will handle None response
            print("DEBUG Supabase exception:", e, file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return None

    @staticmethod
    def query_supabase_book(prompt: str):
        """
        1) extract book name from prompt
        2) try ilike title, then subtitle
        3) fallback: load all books and fuzzy-match locally
        4) fetch authors via book_authors -> authors
        """
        book_name = LibraryUtils.extract_book_name(prompt)
        print(f"DEBUG: Extracted book_name: '{book_name}'", file=sys.stderr)
        if not book_name:
            return None

        # Try searching title ilike first (safer than pulling entire table)
        for attempt in range(SEARCH_RETRY_COUNT):
            res = LibraryUtils._safe_execute(
                lambda: supabase.table("books").select("*").ilike("title", f"%{book_name}%").execute()
            )
            if res is None:
                time.sleep(SEARCH_RETRY_DELAY)
                continue
            if res.data:
                candidates = res.data
                break
            # try subtitle search
            res2 = LibraryUtils._safe_execute(
                lambda: supabase.table("books").select("*").ilike("subtitle", f"%{book_name}%").execute()
            )
            if res2 is None:
                time.sleep(SEARCH_RETRY_DELAY)
                continue
            candidates = res2.data or []
            break
        else:
            # final fallback: load all books (only if previous failed)
            all_res = LibraryUtils._safe_execute(lambda: supabase.table("books").select("*").execute())
            candidates = all_res.data if all_res and all_res.data else []

        if not candidates:
            print("DEBUG: No matching book rows returned by DB", file=sys.stderr)
            return None

        # fuzzy match among candidates
        best_match = None
        best_score = 0.0
        for b in candidates:
            t = b.get("title") or ""
            s = b.get("subtitle") or ""
            score = LibraryUtils.similar_match_score(t, book_name)
            score = max(score, LibraryUtils.similar_match_score(s, book_name))
            if score > best_score:
                best_score = score
                best_match = b

        print(f"DEBUG: best_score={best_score} title={best_match.get('title') if best_match else None}", file=sys.stderr)
        if not best_match or best_score < MIN_CONFIDENCE:
            return None

        # fetch authors via junction
        book_id = best_match.get("book_id")
        if not book_id:
            # try alternate keys if your schema used a different primary column
            book_id = best_match.get("id")  # just-in-case
        if not book_id:
            print("DEBUG: no book_id found on matched row", file=sys.stderr)
            return best_match  # return book row without authors

        link_res = LibraryUtils._safe_execute(
            lambda: supabase.table("book_authors").select("author_id").eq("book_id", book_id).execute()
        )
        authors = []
        if link_res and link_res.data:
            # collect author_ids and get names in one or few queries
            author_ids = [link.get("author_id") for link in link_res.data if link.get("author_id") is not None]
            # fetch names; loop is fine for small author count
            for aid in author_ids:
                a_res = LibraryUtils._safe_execute(lambda aid=aid: supabase.table("authors").select("name").eq("author_id", aid).execute())
                if a_res and a_res.data:
                    authors.append(a_res.data[0].get("name"))
        best_match["authors"] = authors
        return best_match


# ---------- AI fallback (unchanged) ----------
def call_library_ai(prompt: str) -> str:
    try:
        proc = subprocess.run(
            ["ollama", "run", "library-bot"],
            input=prompt.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=120
        )
        if proc.stderr:
            print("DEBUG ollama error:", proc.stderr.decode("utf-8"), file=sys.stderr)
        return proc.stdout.decode("utf-8", errors="ignore").strip()
    except subprocess.TimeoutExpired:
        return "Sorry, the response took too long. Please try again."


# ---------- response helpers ----------
def get_field_response(book: dict, field: str, field_label: str = None, fallback_to_ai: bool = True):
    if book and is_available_field(book.get(field)):
        return f"{field_label or field.capitalize()} of '{book.get('title', 'this book')}' is {book.get(field)}."
    elif fallback_to_ai:
        return None
    else:
        return f"Sorry, the book or information is not found."


def get_library_response(prompt: str) -> str:
    greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]
    lower_prompt = prompt.lower().strip()

    if any(g in lower_prompt for g in greetings):
        return "Hello! This is LibraX, your friendly library assistant. How may I help you today?"

    if not LibraryUtils.is_library_keyword(prompt):
        return "Sorry, I can only help with library-related inquiries."

    try:
        book = LibraryUtils.query_supabase_book(prompt)

        # check fields requested
        for attribute, label in [
            ("authors", "Author"),
            ("isbn", "ISBN"),
            ("description", "Description"),
            ("available_copies", "Available Copies"),
            ("edition", "Edition"),
            ("language", "Language"),
            ("publisher", "Publisher"),
        ]:
            if attribute.replace("_", " ") in lower_prompt:
                if attribute == "authors":
                    if book and book.get("authors"):
                        # nice grammar for multiple authors
                        authors = book["authors"]
                        if len(authors) == 1:
                            return f"The author of '{book.get('title')}' is {authors[0]}."
                        elif len(authors) == 2:
                            return f"The authors of '{book.get('title')}' are {authors[0]} and {authors[1]}."
                        else:
                            return f"The authors of '{book.get('title')}' are {', '.join(authors[:-1])}, and {authors[-1]}."
                    elif book:
                        return f"Author of '{book.get('title')}' is not available in the database."
                    else:
                        return "Sorry, that book is not found in the library database."
                resp = get_field_response(book, attribute, label)
                if resp:
                    return resp
                else:
                    return call_library_ai(prompt)

        # availability check
        if any(k in lower_prompt for k in inventory_keywords):
            if book and is_available_field(book.get("available_copies")):
                try:
                    count = int(book.get("available_copies"))
                except Exception:
                    count = 0
                if count > 0:
                    return f"Yes, '{book.get('title')}' is available. There {'is' if count == 1 else 'are'} {count} {'copy' if count == 1 else 'copies'} left."
                else:
                    return f"No, '{book.get('title')}' is currently unavailable."
            else:
                return "Sorry, that book is not found in the library database."

        # publication year
        if "year" in lower_prompt or "publication" in lower_prompt:
            if book and book.get("publication_year") is not None:
                return f"'{book.get('title')}' was published in {book.get('publication_year')}."
            elif book:
                return f"Publication year of '{book.get('title')}' is not available in the database."
            else:
                return "Sorry, that book is not found in the library database."

        if "subtitle" in lower_prompt:
            if book and is_available_field(book.get("subtitle")):
                return f"The subtitle of '{book.get('title')}' is {book.get('subtitle')}."
            elif book:
                return f"Subtitle of '{book.get('title')}' is not available in the database."
            else:
                return "Sorry, that book is not found in the library database."

        # default: return full info or fallback to AI
        if book:
            authors = ", ".join(book.get("authors", [])) or "Unknown"
            return (
                f"Book: '{book.get('title')}', "
                f"Author: {authors}, "
                f"Available Copies: {book.get('available_copies')}, "
                f"ISBN: {book.get('isbn')}, "
                f"Subtitle: {book.get('subtitle')}, "
                f"Description: {book.get('description')}, "
                f"Publication Year: {book.get('publication_year')}, "
                f"Edition: {book.get('edition')}, "
                f"Language: {book.get('language')}, "
                f"Publisher: {book.get('publisher')}"
            )
        else:
            return call_library_ai(prompt)

    except Exception as e:
        print("DEBUG: top-level error:", e, file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return "Sorry, an error occurred while processing your request."


if __name__ == "__main__":
    try:
        prompt_input = sys.stdin.read().strip()
        if not prompt_input:
            print("Send a prompt via stdin. Example: echo \"Who is the author of Harry Potter?\" | python libraX_Bot.py")
            sys.exit(0)
        response_output = get_library_response(prompt_input)
        print(response_output)
    except Exception:
        traceback.print_exc(file=sys.stderr)
        print("Sorry, an error occurred while processing your request.", file=sys.stdout)
