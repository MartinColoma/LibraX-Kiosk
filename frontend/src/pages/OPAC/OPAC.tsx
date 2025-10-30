import { useState } from 'react';
import { Search } from 'lucide-react';
import styles from './OPAC.module.css';
import Chatbot from './modals/Chatbot/Chatbot';
import axios from 'axios';

interface Book {
  book_id: string;
  title: string;
  author?: string;
  publisher?: string;
  publication_year?: number;
  genre?: string;
  available?: number;
  total?: number;
}

const searchTypes = [
  { value: 'keyword', label: 'Keyword' },
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'subject', label: 'Subject' },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function OPAC() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('keyword');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchType(e.target.value);
    setResults([]);
    setQuery('');
    setSearched(false);
  };

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.trim() === '') {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/opac/search?type=${searchType}&query=${encodeURIComponent(searchQuery)}`
      );

      console.log('API Response:', data);

      if (Array.isArray(data)) {
        setResults(data);
      } else if (data?.results && Array.isArray(data.results)) {
        setResults(data.results);
      } else if (data?.data && Array.isArray(data.data)) {
        setResults(data.data);
      } else {
        setResults([]);
      }

      setSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      performSearch(value);
    }, 300); // 300ms debounce

    setDebounceTimer(timer);
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
            {searchTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
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
          <p className={styles.searchHint}>
            Enter a search query to show results
          </p>
        ) : (
          <div className={styles.resultsContainer}>
            <p className={styles.resultCount}>Results: {results.length}</p>

            {results.length === 0 ? (
              <p className={styles.searchHint}>No books found.</p>
            ) : (
              results.map((book) => {
                // Convert to numbers to ensure proper comparison
                const availableCopies = parseInt(book.available?.toString() || '0', 10);
                const totalCopies = parseInt(book.total?.toString() || '0', 10);
                const isAvailable = availableCopies > 0;

                return (
                  <div key={book.book_id} className={styles.bookCard}>
                    <div className={styles.bookDetails}>
                      <p className={styles.bookType}>Book</p>
                      <h3 className={styles.bookTitle}>{book.title}</h3>
                      <p className={styles.bookMeta}>
                        Author: {book.author || 'N/A'}
                        <br />
                        Publisher: {book.publisher || 'N/A'} •{' '}
                        {book.publication_year || 'N/A'}
                        <br />
                        Genre: {book.genre || 'N/A'}
                      </p>
                      <p
                        className={
                          isAvailable
                            ? styles.available
                            : styles.notAvailable
                        }
                      >
                        {isAvailable ? (
                          <>
                            ✅ <strong>Available:</strong> {availableCopies} of{' '}
                            {totalCopies} copies remaining
                          </>
                        ) : (
                          <>
                            ❌ <strong>Not Available:</strong>{' '}
                            {availableCopies} of {totalCopies} copies
                            remaining
                          </>
                        )}
                      </p>
                    </div>

                    <div className={styles.bookAction}>
                      <button
                        className={`${styles.requestBtn} ${
                          !isAvailable
                            ? styles.disabledBtn
                            : ''
                        }`}
                        disabled={!isAvailable}
                      >
                        Request Item
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <Chatbot />
    </div>
  );
}