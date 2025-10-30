import os
import re
import sys
from supabase import create_client
from dotenv import load_dotenv
import subprocess
import difflib
import traceback

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise Exception("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
        cleaned = prompt.lower()
        ignore_words = [
            "when", "what", "year", "published", "date", "is", "was", "book",
            "the", "of", "who", "author", "in", "on", "and", "edition", "subtitle",
            "description", "language", "quantity", "publication", "copies",
            "available", "status", "publisher", "genre", "can i", "find",
            "borrow", "checkout", "library", "isbn", "left", "still"
        ]
        for w in ignore_words:
            cleaned = re.sub(r'\b' + re.escape(w) + r'\b', '', cleaned)
        cleaned = cleaned.replace("?", "").replace(".", "").strip()
        match = re.search(r'"(.+?)"', cleaned) or re.search(r"'(.+?)'", cleaned)
        if match:
            return match.group(1).title()
        return cleaned.title()

    @staticmethod
    def similar_match_score(str1, str2):
        return difflib.SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

    @staticmethod
    def query_supabase_book(prompt):
        book_name = LibraryUtils.extract_book_name(prompt)
        print(f"DEBUG: Extracted book_name: '{book_name}'", file=sys.stderr)

        try:
            result = supabase.table("books").select("*").or_(
                f"title.ilike.%{book_name}%,subtitle.ilike.%{book_name}%"
            ).execute()

            if not result.data:
                print("DEBUG: No matching book found in 'books'", file=sys.stderr)
                return None

            best_match = None
            best_score = 0
            for b in result.data:
                score = LibraryUtils.similar_match_score(b.get('title', ''), book_name)
                if b.get('subtitle'):
                    score = max(score, LibraryUtils.similar_match_score(b.get('subtitle', ''), book_name))
                if score > best_score:
                    best_score = score
                    best_match = b

            if not best_match or best_score < MIN_CONFIDENCE:
                print("DEBUG: No confident match found", file=sys.stderr)
                return None

            # Get authors
            book_id = best_match.get("book_id")
            author_links = supabase.table("book_authors").select("author_id").eq("book_id", book_id).execute()
            authors = []
            if author_links.data:
                author_ids = [link["author_id"] for link in author_links.data]
                author_res = supabase.table("authors").select("name").in_("author_id", author_ids).execute()
                if author_res.data:
                    authors = [a["name"] for a in author_res.data]

            best_match["authors"] = authors
            print(f"DEBUG: Book '{best_match.get('title')}' authors={authors}", file=sys.stderr)
            return best_match

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

def get_library_response(prompt):
    lower_prompt = prompt.lower().strip()
    greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]

    # --- Greetings ---
    if any(g in lower_prompt for g in greetings):
        return "Hello! This is LibraX, your friendly library assistant. How may I help you today?"

    # --- Borrow / return instructions ---
    if "how to borrow" in lower_prompt:
        return ("To borrow a book, search for the book in the OPAC search bar. "
                "If it's available, click 'Request Item'. Scan your NFC or enter your account info manually. "
                "A pop-up will show the book details. Enter your password to confirm, then wait for librarian approval. Happy reading!")

    if "how to return overdue" in lower_prompt:
        return ("To return an overdue book and pay fines, click the 'Return Book' button on your dashboard. "
                "Scan your NFC card or manually enter your account info. You will see a list of overdue books. "
                "Select the book you want to pay for. Confirm if your payment amount is complete, then pay using the coin slot on the kiosk. "
                "After payment, insert the book into the kiosk slit to successfully return it.")

    if "how to return" in lower_prompt:
        return ("To return a book, click the 'Return Book' button on your dashboard. "
                "Scan your NFC card or manually enter your account info. You will see a list of borrowed books. "
                "Select the book you want to return, insert it into the kiosk slit, and it will be successfully returned.")

    # --- Check if library-related ---
    if not LibraryUtils.is_library_keyword(prompt):
        return "Sorry, I can only help with library-related inquiries."

    # --- Query database ---
    book = LibraryUtils.query_supabase_book(prompt)
    book_found = book is not None
    book_name = LibraryUtils.extract_book_name(prompt)

    # --- Author ---
    if "author" in lower_prompt or "who wrote" in lower_prompt:
        if book_found and book.get("authors"):
            return f"The author of '{book.get('title')}' is {', '.join(book['authors'])}."
        else:
            return f"Sorry, '{book_name}' is unavailable in the library."

    # --- ISBN ---
    if "isbn" in lower_prompt:
        if book_found and book.get("isbn"):
            return f"The ISBN of '{book.get('title')}' is {book.get('isbn')}."
        else:
            return f"Sorry, '{book_name}' is unavailable in the library."

    # --- Subtitle ---
    if "subtitle" in lower_prompt:
        if book_found and is_available_field(book.get("subtitle")):
            return f"The subtitle of '{book.get('title')}' is {book.get('subtitle')}."
        else:
            return f"Sorry, '{book_name}' is unavailable in the library."

    # --- Edition ---
    if "edition" in lower_prompt:
        if book_found and is_available_field(book.get("edition")):
            return f"The edition of '{book.get('title')}' is {book.get('edition')}."
        else:
            return f"Sorry, '{book_name}' is unavailable in the library."

    # --- Year / publication ---
    if "year" in lower_prompt or "published" in lower_prompt or "publication" in lower_prompt:
        if book_found and is_available_field(book.get("publication_year")):
            return f"'{book.get('title')}' was published in {book.get('publication_year')}."
        else:
            return f"Sorry, '{book_name}' is unavailable in the library."

    # --- Language ---
    if "language" in lower_prompt:
        if book_found and is_available_field(book.get("language")):
            return f"The language of '{book.get('title')}' is {book.get('language')}."
        else:
            return f"Sorry, '{book_name}' is unavailable in the library."

    # --- Availability / copies ---
    if any(k in lower_prompt for k in inventory_keywords):
        if book_found and is_available_field(book.get("available_copies")):
            count = int(book.get("available_copies"))
            return f"Yes, '{book.get('title')}' is available. There {'is' if count==1 else 'are'} {count} {'copy' if count==1 else 'copies'} left."
        else:
            return f"Sorry, '{book_name}' is unavailable in the library."

    # --- Default book info ---
    if book_found:
        authors = ", ".join(book.get("authors", [])) or "Unknown"
        return (f"Book: '{book.get('title')}', Author: {authors}, "
                f"Available Copies: {book.get('available_copies')}, ISBN: {book.get('isbn')}, "
                f"Subtitle: {book.get('subtitle')}, Description: {book.get('description')}, "
                f"Publication Year: {book.get('publication_year')}, Edition: {book.get('edition')}, "
                f"Language: {book.get('language')}, Publisher: {book.get('publisher')}")

    return f"Sorry, '{book_name}' is unavailable in the library."

if __name__ == "__main__":
    try:
        prompt_input = sys.stdin.read().strip()
        response_output = get_library_response(prompt_input)
        print(response_output)
    except:
        traceback.print_exc(file=sys.stderr)
        print("Sorry, an error occurred while processing your request.", file=sys.stdout)
