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
  isbn?: string;
}

interface UserData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  student_faculty_id: string;
  address: string;
  date_registered: string;
  nfc_uid: string;
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

  // NFC Scan states
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [scanRequestId, setScanRequestId] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState('');
  const [scannedUser, setScannedUser] = useState<UserData | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);

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

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      performSearch(value);
    }, 300);

    setDebounceTimer(timer);
  };

  // ===== NFC Scan Functions =====
  const startNFCScan = async (book: Book) => {
    setSelectedBook(book);
    setShowScanModal(true);
    setScanMessage('Initiating scan request...');
    setScannedUser(null);
    setRequestSuccess(false);

    try {
      const sessionId = 'opac_' + Date.now();
      const response = await axios.post(`${API_BASE_URL}/attendance/request-scan`, {
        sessionId,
        book_id: book.book_id
      });

      if (response.data.success) {
        setScanRequestId(response.data.requestId);
        setScanMessage('Waiting for NFC scan...');
        pollForScanCompletion(response.data.requestId);
      } else {
        setScanMessage('Failed to initiate scan');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanMessage('Error: ' + (error as any).message);
    }
  };

  const pollForScanCompletion = (requestId: string) => {
    let pollCount = 0;
    const maxPolls = 30; // 60 seconds with 2s interval

    const interval = setInterval(async () => {
      pollCount++;

      if (pollCount > maxPolls) {
        clearInterval(interval);
        setScanMessage('Scan timeout. Please try again.');
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/attendance/scan-status?requestId=${requestId}`
        );

        if (response.data.success && response.data.request.status === 'completed') {
          clearInterval(interval);

          const responseData = JSON.parse(response.data.request.response || '{}');
          if (responseData.user) {
            setScannedUser(responseData.user);
            setScanMessage('');
          }
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 2000);
  };

  const confirmBookRequest = async () => {
    if (!selectedBook || !scannedUser) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/books/request`, {
        nfc_uid: scannedUser.nfc_uid,
        book_id: selectedBook.book_id
      });

      if (response.data.success) {
        setRequestSuccess(true);
        setScanMessage('✅ Request approved successfully!');
        
        setTimeout(() => {
          closeScanModal();
          // Refresh results
          if (query) performSearch(query);
        }, 2000);
      } else {
        setScanMessage('❌ ' + response.data.message);
      }
    } catch (error) {
      console.error('Request error:', error);
      setScanMessage('❌ Failed to submit request');
    }
  };

  const closeScanModal = async () => {
    if (scanRequestId) {
      try {
        await axios.post(`${API_BASE_URL}/attendance/cancel-request`, {
          requestId: scanRequestId
        });
      } catch (error) {
        console.error('Cancel error:', error);
      }
    }
    setShowScanModal(false);
    setSelectedBook(null);
    setScanRequestId(null);
    setScanMessage('');
    setScannedUser(null);
    setRequestSuccess(false);
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
                        onClick={() => startNFCScan(book)}
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

      {/* NFC Scan Modal */}
      {showScanModal && selectedBook && (
        <div className={styles.modalOverlay} onClick={closeScanModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Request Details</h3>

            {!scannedUser ? (
              // Scan Phase
              <div className={styles.scanPhase}>
                <div className={styles.nfcIcon}>📱)))</div>
                <p className={styles.scanStatus}>{scanMessage || 'Waiting for NFC scan...'}</p>
                <p className={styles.scanHint}>
                  Please scan your NFC card at the ESP32 kiosk
                </p>
              </div>
            ) : (
              // Details Phase
              <div className={styles.modalContent}>
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>Book Information</h4>
                  <p><strong>Title:</strong> {selectedBook.title}</p>
                  <p><strong>Author:</strong> {selectedBook.author || 'N/A'}</p>
                  <p><strong>Genre:</strong> {selectedBook.genre || 'N/A'}</p>
                  <p><strong>Publisher:</strong> {selectedBook.publisher || 'N/A'}</p>
                  <p><strong>Language:</strong> English</p>
                  <p><strong>ISBN:</strong> {selectedBook.isbn || 'N/A'}</p>
                  <p><strong>Due Date:</strong> {new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]} (30days)</p>
                </div>

                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>Borrower Detail</h4>
                  <p><strong>Full Name:</strong> {scannedUser.first_name} {scannedUser.last_name}</p>
                  <p><strong>Student/Faculty ID No.:</strong> {scannedUser.student_faculty_id}</p>
                  <p><strong>Email Address:</strong> {scannedUser.email}</p>
                  <p><strong>Phone Number:</strong> {scannedUser.phone_number}</p>
                  <p><strong>Address:</strong> {scannedUser.address}</p>
                  <p><strong>Member Since:</strong> {scannedUser.date_registered}</p>
                </div>

                {requestSuccess && (
                  <p className={styles.successMessage}>✅ {scanMessage}</p>
                )}
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={closeScanModal}
                disabled={requestSuccess}
              >
                Cancel
              </button>
              {scannedUser && !requestSuccess && (
                <button
                  className={styles.requestBtn}
                  onClick={confirmBookRequest}
                >
                  Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Chatbot />
    </div>
  );
}
