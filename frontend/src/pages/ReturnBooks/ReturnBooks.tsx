import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ReturnBooks.module.css";

interface BorrowedBook {
  borrow_id: string;
  copy_id: string;
  book_id: string;
  borrow_date: string;
  due_date: string;
  status: string;
  fine_amount: number;
  is_overdue: boolean;
  days_overdue: number;
  books: {
    title: string;
    subtitle?: string;
    isbn?: string;
    publisher?: string;
    publication_year?: number;
  };
  book_copies: {
    nfc_uid: string;
    book_condition: string;
    location: string;
  };
}

interface UserInfo {
  user_id: string;
  name: string;
  student_faculty_id: string;
}

const API_BASE_URL = "https://librax-kiosk-api.onrender.com";


const ReturnBooks: React.FC = () => {
  const navigate = useNavigate();
  
  // Authentication state
  const [isScanning, setIsScanning] = useState(true);
  const [scanRequestId, setScanRequestId] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualIdInput, setManualIdInput] = useState("");
  const [scanError, setScanError] = useState("");
  
  // User and books state
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  
  // Return process state
  const [isReturning, setIsReturning] = useState(false);
  const [returnScanRequestId, setReturnScanRequestId] = useState<string | null>(null);
  const [returnedBooks, setReturnedBooks] = useState<string[]>([]);
  const [currentScanning, setCurrentScanning] = useState<string | null>(null);
  
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const returnPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);

  // ==================== INITIAL USER SCAN ====================
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      clearOldScanRequests();
      initiateUserScan();
    }
    return () => {
      cancelScanRequest();
    };
  }, []);

  useEffect(() => {
    if (scanRequestId && isScanning) {
      startPollingUserScan(scanRequestId);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [scanRequestId]);

  const clearOldScanRequests = async () => {
    try {
      await fetch(`${API_BASE_URL}/attendance/clear-old-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "return-books-session" })
      });
    } catch (err) {
      console.warn("Could not clear old requests:", err);
    }
  };

  const initiateUserScan = async () => {
    try {
      setScanError("");
      const res = await fetch(`${API_BASE_URL}/attendance/request-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "return-books-session" })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setScanRequestId(data.requestId);
    } catch (err: any) {
      console.error("Failed to create scan request:", err);
      setScanError(err.message || "Failed to initiate scan");
    }
  };

  const startPollingUserScan = (requestId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/attendance/scan-status?requestId=${requestId}`);
        const data = await res.json();
        
        if (!res.ok || !data.success || !data.request) return;
        
        if (data.request.status === "completed" && data.request.response) {
          const result = JSON.parse(data.request.response);
          if (result?.user) {
            await fetchBorrowedBooks(result.user.user_id);
            setIsScanning(false);
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  };

  const cancelScanRequest = async () => {
    if (!scanRequestId) return;
    try {
      await fetch(`${API_BASE_URL}/attendance/cancel-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: scanRequestId })
      });
    } catch (err) {
      console.warn("Failed to cancel scan:", err);
    } finally {
      setScanRequestId(null);
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  };

  const handleManualInput = async () => {
    if (!manualIdInput.trim()) {
      setScanError("Please enter your ID number");
      return;
    }
    try {
      await cancelScanRequest();
      const res = await fetch(
        `${API_BASE_URL}/return-books/user-borrowed?student_id=${manualIdInput.trim()}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      
      setUserInfo(data.user);
      setBorrowedBooks(data.borrowed_books);
      setIsScanning(false);
      setShowManualInput(false);
    } catch (err: any) {
      console.error("Manual input error:", err);
      setScanError(err.message || "Failed to fetch borrowed books");
    }
  };

  const fetchBorrowedBooks = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/return-books/user-borrowed?user_id=${userId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      
      setUserInfo(data.user);
      setBorrowedBooks(data.borrowed_books);
    } catch (err: any) {
      console.error("Failed to fetch borrowed books:", err);
      setScanError(err.message || "Failed to load borrowed books");
    }
  };

  // ==================== BOOK SELECTION ====================
  const toggleBookSelection = (borrowId: string) => {
    setSelectedBooks(prev =>
      prev.includes(borrowId)
        ? prev.filter(id => id !== borrowId)
        : [...prev, borrowId]
    );
  };

  const selectAll = () => {
    setSelectedBooks(borrowedBooks.map(book => book.borrow_id));
  };

  const deselectAll = () => {
    setSelectedBooks([]);
  };

  // ==================== BOOK RETURN PROCESS ====================
  const handleReturnBooks = async () => {
    if (selectedBooks.length === 0) {
      alert("Please select at least one book to return");
      return;
    }

    try {
      setIsReturning(true);
      const res = await fetch(`${API_BASE_URL}/return-books/request-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "book-return-session",
          borrow_ids: selectedBooks
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      
      setReturnScanRequestId(data.requestId);
      setCurrentScanning("Scan your first book...");
    } catch (err: any) {
      console.error("Failed to initiate return:", err);
      alert(err.message || "Failed to start return process");
      setIsReturning(false);
    }
  };

  useEffect(() => {
    if (returnScanRequestId && isReturning) {
      startPollingReturnScan(returnScanRequestId);
    }
    return () => {
      if (returnPollingRef.current) clearInterval(returnPollingRef.current);
    };
  }, [returnScanRequestId]);

  const startPollingReturnScan = (requestId: string) => {
    if (returnPollingRef.current) clearInterval(returnPollingRef.current);
    
    returnPollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/return-books/scan-status?requestId=${requestId}`);
        const data = await res.json();
        
        if (!res.ok || !data.success) return;
        
        if (data.returned_books && data.returned_books.length > returnedBooks.length) {
          setReturnedBooks(data.returned_books.map((b: any) => b.borrow_id));
          
          if (data.remaining_books === 0) {
            // All books returned
            if (returnPollingRef.current) clearInterval(returnPollingRef.current);
            setTimeout(() => {
              navigate("/");
            }, 2000);
          } else {
            setCurrentScanning(`${data.remaining_books} book(s) remaining. Scan next book...`);
          }
        }
      } catch (err) {
        console.error("Return polling error:", err);
      }
    }, 2000);
  };

  const cancelReturn = async () => {
    if (returnScanRequestId) {
      try {
        await fetch(`${API_BASE_URL}/return-books/cancel-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: returnScanRequestId })
        });
      } catch (err) {
        console.warn("Failed to cancel return:", err);
      }
    }
    setIsReturning(false);
    setReturnScanRequestId(null);
    setReturnedBooks([]);
    setCurrentScanning(null);
    if (returnPollingRef.current) clearInterval(returnPollingRef.current);
  };

  // ==================== RENDER ====================
  if (isScanning && !showManualInput) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.scanCard}>
          <h2>Scan Your ID</h2>
          <div className={styles.nfcIcon}>📱</div>
          <p>Please scan your NFC card or student ID</p>
          {scanError && <p className={styles.errorText}>{scanError}</p>}
          <button 
            className={styles.linkButton}
            onClick={() => {
              cancelScanRequest();
              setShowManualInput(true);
            }}
          >
            Enter ID manually
          </button>
          <button className={styles.cancelButton} onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (showManualInput) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.scanCard}>
          <h2>Enter Your ID</h2>
          <input
            type="text"
            className={styles.input}
            placeholder="Student/Faculty ID"
            value={manualIdInput}
            onChange={(e) => setManualIdInput(e.target.value)}
            autoFocus
          />
          {scanError && <p className={styles.errorText}>{scanError}</p>}
          <div className={styles.buttonGroup}>
            <button className={styles.cancelButton} onClick={() => {
              setShowManualInput(false);
              initiateUserScan();
            }}>
              Back
            </button>
            <button className={styles.primaryButton} onClick={handleManualInput}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isReturning) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.scanCard}>
          <h2>Scan Books to Return</h2>
          <div className={styles.nfcIcon}>📚</div>
          <p>{currentScanning}</p>
          <div className={styles.progressInfo}>
            <p>Returned: {returnedBooks.length} / {selectedBooks.length}</p>
          </div>
          {returnedBooks.map(bookId => (
            <div key={bookId} className={styles.returnedBookItem}>
              ✓ Book returned
            </div>
          ))}
          <button className={styles.cancelButton} onClick={cancelReturn}>
            Cancel Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>LibraX</h1>
        <p className={styles.subtitle}>AIoT Library Kiosk</p>
      </div>

      <div className={styles.content}>
        <h2 className={styles.pageTitle}>RETURN BOOK/S</h2>
        
        {userInfo && (
          <div className={styles.userInfo}>
            <p><strong>User:</strong> {userInfo.name}</p>
            <p><strong>ID:</strong> {userInfo.student_faculty_id}</p>
          </div>
        )}

        {borrowedBooks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You have no borrowed books to return.</p>
            <button className={styles.primaryButton} onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        ) : (
          <>
            <div className={styles.bookList}>
              {borrowedBooks.map((book) => (
                <div 
                  key={book.borrow_id} 
                  className={`${styles.bookItem} ${
                    selectedBooks.includes(book.borrow_id) ? styles.selected : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedBooks.includes(book.borrow_id)}
                    onChange={() => toggleBookSelection(book.borrow_id)}
                    className={styles.checkbox}
                  />
                  <div className={styles.bookDetails}>
                    <h3 className={styles.bookTitle}>{book.books.title}</h3>
                    {book.books.subtitle && (
                      <p className={styles.bookSubtitle}>{book.books.subtitle}</p>
                    )}
                    <div className={styles.bookMeta}>
                      <p><strong>Publisher:</strong> {book.books.publisher || "N/A"}</p>
                      <p><strong>Genre:</strong> Fiction</p>
                      {book.is_overdue && (
                        <p className={styles.overdue}>
                          <strong>Fine:</strong> Php {book.fine_amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <button className={styles.secondaryButton} onClick={selectAll}>
                Select All
              </button>
              <button className={styles.secondaryButton} onClick={deselectAll}>
                Deselect All
              </button>
            </div>

            <div className={styles.footer}>
              <button className={styles.cancelButton} onClick={() => navigate("/")}>
                Cancel
              </button>
              <button 
                className={styles.primaryButton} 
                onClick={handleReturnBooks}
                disabled={selectedBooks.length === 0}
              >
                Return Book/s
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReturnBooks;