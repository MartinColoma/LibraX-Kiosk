import os
import re
import sys
from supabase import create_client
from dotenv import load_dotenv
import subprocess
import difflib
import traceback

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise Exception("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

keywords = [
    "book", "author", "isbn", "catalog", "borrow",
    "library", "reading", "reference", "return",
    "reserve", "renew", "fine", "due date",
    "shelf", "card", "dashboard", "subtitle",
    "description", "publication", "year",
    "edition", "language",
    "quantity", "copies", "available", "left", "have", "in stock", "how many",
    "still available", "is available", "availability", "status",
    "publisher", "genre"
]
inventory_keywords = [
    "availability", "status", "available", "still available", "in stock",
    "find", "borrow", "checkout", "is", "can i", "library"
]
MIN_CONFIDENCE = 0.3

def is_available_field(val):
    return val is not None and str(val).strip().upper() not in ("", "NONE", "NULL", "EMPTY")

class LibraryUtils:
    @staticmethod
    def is_library_keyword(prompt):
        words = prompt.lower().split()
        for w in words:
            if difflib.get_close_matches(w, keywords, n=1, cutoff=0.7):
                return True
        return False

    @staticmethod
    def extract_book_name(prompt):
        PROMPT_IGNORE = [
            "when", "what", "year", "published", "publhed", "date",
            "is", "was", "book", "the", "of", "who", "author", "in", "on",
            "and", "edition", "subtitle", "description", "language", "quantity",
            "publication", "copies", "available", "status", "publisher", "genre",
            "can i", "find", "borrow", "checkout", "library"
        ]
        cleaned = prompt.lower()
        for w in PROMPT_IGNORE:
            cleaned = re.sub(r'\b' + re.escape(w) + r'\b', '', cleaned)
        cleaned = cleaned.replace("?", "").replace(".", "").strip()
        match = re.search(r'"(.+?)"', cleaned) or re.search(r"'(.+?)'", cleaned)
        if match:
            return match.group(1).strip().title()
        return cleaned.strip().title()

    @staticmethod
    def similar_match_score(str1, str2):
        return difflib.SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

    @staticmethod
    def query_supabase_book(prompt):
        book_name = LibraryUtils.extract_book_name(prompt)
        print(f"DEBUG: Extracted book_name: '{book_name}'", file=sys.stderr)
        try:
            result = supabase.table("books").select("*").or_(
                f"book_name.ilike.%{book_name}%,subtitle.ilike.%{book_name}%"
            ).execute()
            print(f"DEBUG: Supabase result data: {result.data}", file=sys.stderr)
            if not result.data:
                return None

            best_match = None
            best_score = 0
            for b in result.data:
                score = LibraryUtils.similar_match_score(b.get('book_name', ''), book_name)
                if b.get('subtitle'):
                    score = max(score, LibraryUtils.similar_match_score(b.get('subtitle', ''), book_name))
                if score > best_score:
                    best_score = score
                    best_match = b

            if best_match:
                print(f"DEBUG: Best match '{best_match.get('book_name')}' with score {best_score}", file=sys.stderr)
            return best_match if best_score >= MIN_CONFIDENCE else None
        except Exception as e:
            print(f"DEBUG Supabase exception: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return None

def call_library_ai(prompt):
    try:
        proc = subprocess.run(
            ["ollama", "run", "library-bot"],
            input=prompt.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=120
        )
        if proc.stderr:
            print(f"DEBUG ollama error: {proc.stderr.decode('utf-8')}", file=sys.stderr)
        return proc.stdout.decode("utf-8", errors="ignore").strip()
    except subprocess.TimeoutExpired:
        return "Sorry, the response took too long. Please try again."

def get_field_response(book, field, field_label=None, fallback_to_ai=True):
    if book is not None and is_available_field(book.get(field)):
        return f"{field_label or field.capitalize()} of '{book.get('book_name', 'this book')}' is {book.get(field)}."
    elif book is not None:
        return f"No {field_label or field} information for '{book.get('book_name', 'this book')}'."
    elif fallback_to_ai:
        return None
    else:
        return f"Sorry, the book or information is not found."

def get_library_response(prompt):
    greetings = [
        "hi", "hello", "hey", "good morning", "good afternoon", "good evening"
    ]
    lower_prompt = prompt.lower().strip()

    if any(g in lower_prompt for g in greetings):
        return "Hello! This is LibraX, your friendly library assistant. How may I help you today?"

    if not LibraryUtils.is_library_keyword(prompt):
        return "Sorry, I can only help with library-related inquiries."

    try:
        book = LibraryUtils.query_supabase_book(prompt)

        # Inventory/availability: combine status and quantity
        if any(k in lower_prompt for k in inventory_keywords):
            if book and is_available_field(book.get("status")):
                status = str(book.get("status", "")).lower()
                quantity = book.get("quantity", None)
                book_name = book.get('book_name', 'this book')
                if status == "available" and is_available_field(quantity) and int(quantity) > 0:
                    return f"Yes, '{book_name}' is available. There {'is' if int(quantity)==1 else 'are'} {quantity} {'copy' if int(quantity)==1 else 'copies'} in stock."
                elif status == "available":
                    return f"Yes, '{book_name}' is available, but there are currently no copies in stock."
                elif is_available_field(quantity) and int(quantity) > 0:
                    return f"No, '{book_name}' is currently unavailable, but there {'is' if int(quantity)==1 else 'are'} {quantity} {'copy' if int(quantity)==1 else 'copies'} in the catalog."
                else:
                    return f"No, '{book_name}' is currently unavailable and there are no copies in stock."
            else:
                return "Sorry, that book is not found in the library database."

        # Year and subtitle: strict DB-only
        if "year" in lower_prompt or "publication" in lower_prompt:
            if book and book.get("publication_year") is not None:
                return f"'{book.get('book_name', 'this book')}' was published in {book.get('publication_year')}."
            elif book:
                return f"Publication year of '{book.get('book_name', 'this book')}' is not available in the database."
            else:
                return "Sorry, that book is not found in the library database."

        if "subtitle" in lower_prompt:
            if book and is_available_field(book.get("subtitle")):
                return f"The subtitle of '{book.get('book_name', 'this book')}' is {book.get('subtitle')}."
            elif book:
                return f"Subtitle of '{book.get('book_name', 'this book')}' is not available in the database."
            else:
                return "Sorry, that book is not found in the library database."

        # Other fields: fallback to AI if not found
        if "author" in lower_prompt:
            resp = get_field_response(book, "author", "Author")
            if resp:
                return resp
            else:
                return call_library_ai(prompt)

        if "isbn" in lower_prompt:
            resp = get_field_response(book, "isbn", "ISBN")
            if resp:
                return resp
            else:
                return call_library_ai(prompt)

        if "description" in lower_prompt:
            resp = get_field_response(book, "description", "Description")
            if resp:
                return resp
            else:
                return call_library_ai(prompt)

        if any(k in lower_prompt for k in ["quantity", "copies", "left", "have", "in stock", "how many"]):
            resp = get_field_response(book, "quantity", "Quantity")
            if resp:
                return resp
            else:
                return call_library_ai(prompt)

        if "edition" in lower_prompt:
            resp = get_field_response(book, "edition", "Edition")
            if resp:
                return resp
            else:
                return call_library_ai(prompt)

        if "language" in lower_prompt:
            resp = get_field_response(book, "language", "Language")
            if resp:
                return resp
            else:
                return call_library_ai(prompt)

        if "publisher" in lower_prompt:
            resp = get_field_response(book, "publisher", "Publisher")
            if resp:
                return resp
            else:
                return call_library_ai(prompt)

        if "genre" in lower_prompt:
            resp = get_field_response(book, "genre", "Genre")
            if resp:
                return resp
            else:
                return call_library_ai(prompt)

        # General fallback - full book info string or AI fallback
        if book:
            return (
                f"Book: '{book.get('book_name', 'N/A')}', "
                f"Author: {book.get('author', 'Unknown')}, "
                f"Quantity: {book.get('quantity', 'N/A')}, "
                f"ISBN: {book.get('isbn', 'N/A')}, "
                f"Subtitle: {book.get('subtitle', 'N/A')}, "
                f"Description: {book.get('description', 'N/A')}, "
                f"Publication Year: {book.get('publication_year', 'N/A')}, "
                f"Edition: {book.get('edition', 'N/A')}, "
                f"Language: {book.get('language', 'N/A')}, "
                f"Status: {book.get('status', 'N/A')}, "
                f"Publisher: {book.get('publisher', 'N/A')}, "
                f"Genre: {book.get('genre', 'N/A')}"
            )
        else:
            return call_library_ai(prompt)

    except Exception:
        traceback.print_exc(file=sys.stderr)
        return "Sorry, an error occurred while processing your request."

if __name__ == "__main__":
    try:
        prompt_input = sys.stdin.read().strip()
        response_output = get_library_response(prompt_input)
        print(response_output)
    except Exception:
        traceback.print_exc(file=sys.stderr)
        print("Sorry, an error occurred while processing your request.", file=sys.stdout)
