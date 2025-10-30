import { useState } from 'react';
import { Search } from 'lucide-react';
import styles from './OPAC.module.css';
import Chatbot from './modals/Chatbot/Chatbot';
import axios from 'axios';

interface Book {
  book_id: number;
  title: string;
  author?: string;
  publisher?: string;
  publication_year?: string;
  genre?: string;
  available?: number;
  total?: number;
  // Add more fields as needed based on your DB
}

const searchTypes = [
  { value: "keyword", label: "Keyword" },
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "subject", label: "Subject" },
];

export default function OPAC() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('keyword');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchType(e.target.value);
    setResults([]);
    setQuery('');
    setSearched(false);
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === '') {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(
        `/opac/search?type=${searchType}&query=${encodeURIComponent(value)}`
      );
      setResults(data); // Should be an array from API
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.opacContainer}>
      <header className={styles.opacHeader}>
        <div className={styles.logoSection}>
          <h1 className={styles.logo}>LibraX</h1>
          <p className={styles.subtitle}>AIoT Library Kiosk</p>
        </div>

        <nav className={styles.navLinks}>
          <a href="/">HOME</a>
          <a href="/patron-attendance">ATTENDANCE</a>
          <a href="/return-books">RETURN BOOK/S</a>
        </nav>
      </header>

      <main className={styles.opacMain}>
        <h2 className={styles.pageTitle}>OPEN PUBLIC ACCESS CATALOG</h2>

        <div className={styles.searchBar}>
          <select
            className={styles.searchDropdown}
            value={searchType}
            onChange={handleTypeChange}
          >
            {searchTypes.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search Library Catalog"
            value={query}
            onChange={handleSearch}
          />

          <button
            className={styles.searchBtn}
            tabIndex={-1}
            type="button"
            aria-label="Search"
            disabled
          >
            <Search size={26} />
          </button>
        </div>

        {loading ? (
          <p className={styles.searchHint}>Loading...</p>
        ) : !searched && query === '' ? (
          <p className={styles.searchHint}>Enter a search query to show results</p>
        ) : (
          <div className={styles.resultsContainer}>
            <p className={styles.resultCount}>
              Results: {results.length}
            </p>

            {results.length === 0 ? (
              <p className={styles.searchHint}>No books found.</p>
            ) : (
              results.map((book) => (
                <div key={book.book_id} className={styles.bookCard}>
                  <div className={styles.bookDetails}>
                    <p className={styles.bookType}>Book</p>
                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookMeta}>
                      Author: {book.author || 'N/A'}<br />
                      Publisher: {book.publisher || 'N/A'} • {book.publication_year || 'N/A'}<br />
                      Genre: {book.genre || 'N/A'}
                    </p>
                    <p className={book.available && book.available > 0 ? styles.available : styles.notAvailable}>
                      {book.available && book.available > 0 ? (
                        <>✅ <strong>Available:</strong> {book.available} of {book.total ?? '?'} copies remaining</>
                      ) : (
                        <>❌ <strong>Not Available:</strong> {book.available ?? 0} of {book.total ?? '?'} copies remaining</>
                      )}
                    </p>
                  </div>
                  <div className={styles.bookAction}>
                    <button
                      className={`${styles.requestBtn} ${!book.available || book.available === 0 ? styles.disabledBtn : ''}`}
                      disabled={!book.available || book.available === 0}
                    >
                      Request Item
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <Chatbot />
    </div>
  );
}
