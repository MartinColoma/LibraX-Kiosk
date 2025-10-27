import { useState } from 'react';
import { Search } from 'lucide-react';
import styles from './OPAC.module.css';

interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string;
  year: string;
  genre: string;
  available: number;
  total: number;
}

const mockBooks: Book[] = [
  {
    id: 1,
    title: "Harry Potter and the Chamber of Secrets",
    author: "J.K. Rowling",
    publisher: "Bloomsbury",
    year: "1998",
    genre: "Fiction",
    available: 2,
    total: 4,
  },
  {
    id: 2,
    title: "Rich Dad Poor Dad",
    author: "Robert Kiyosaki",
    publisher: "Warner Books",
    year: "2000",
    genre: "Finance",
    available: 0,
    total: 2,
  },
  {
    id: 3,
    title: "The Broker",
    author: "John Grisham",
    publisher: "Doubleday",
    year: "2005",
    genre: "Thriller",
    available: 1,
    total: 3,
  },
];

export default function OPAC() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Simulate dynamic search filtering
    if (value.trim() === '') {
      setResults([]);
    } else {
      const filtered = mockBooks.filter((book) =>
        book.title.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
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
          <select className={styles.searchDropdown}>
            <option>Keyword</option>
            <option>Title</option>
            <option>Author</option>
            <option>Subject</option>
          </select>

          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search Library Catalog"
            value={query}
            onChange={handleSearch}
          />

          <button className={styles.searchBtn}>
            <Search size={26} />
          </button>
        </div>

        {query === '' ? (
          <p className={styles.searchHint}>Enter a search query to show results</p>
        ) : (
          <div className={styles.resultsContainer}>
            <p className={styles.resultCount}>
              Results: {results.length} of {mockBooks.length}
            </p>

            {results.map((book) => (
              <div key={book.id} className={styles.bookCard}>
                <div className={styles.bookDetails}>
                  <p className={styles.bookType}>Book</p>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <p className={styles.bookMeta}>
                    Author: {book.author}<br />
                    Publisher: {book.publisher} • {book.year}<br />
                    Genre: {book.genre}
                  </p>

                  {book.available > 0 ? (
                    <p className={styles.available}>
                      ✅ <strong>Available:</strong> {book.available} of {book.total} copies remaining
                    </p>
                  ) : (
                    <p className={styles.notAvailable}>
                      ❌ <strong>Not Available:</strong> {book.available} of {book.total} copies remaining
                    </p>
                  )}
                </div>

                <div className={styles.bookAction}>
                  <button
                    className={`${styles.requestBtn} ${
                      book.available === 0 ? styles.disabledBtn : ''
                    }`}
                    disabled={book.available === 0}
                  >
                    Request Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
