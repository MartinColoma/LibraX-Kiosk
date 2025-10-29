import React, { useState, useEffect, useRef } from "react";
import styles from "./AttendanceNFC.module.css";

interface NFCReaderModalProps {
  onClose: () => void;
  onSuccess?: (userName: string, readerNumber: number) => void;
}

const API_BASE_URL = "https://librax-kiosk-api.onrender.com";

const AttendanceNFC: React.FC<NFCReaderModalProps> = ({ onClose, onSuccess }) => {
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [scanRequestId, setScanRequestId] = useState<string | null>(null); // Now used properly
  const [nfcSuccess, setNfcSuccess] = useState(false);
  const [nfcFailed, setNfcFailed] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [readerNumber, setReaderNumber] = useState<number | null>(null);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [manualIdInput, setManualIdInput] = useState<string>("");

  // New effect that triggers polling when scanRequestId changes
  useEffect(() => {
    if (scanRequestId) {
      startPollingScanStatus(scanRequestId);
    }
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [scanRequestId]);

  // Modified initiateScanRequest no longer calls polling directly
  const initiateScanRequest = async () => {
    try {
      setNfcSuccess(false);
      setNfcFailed(false);
      setErrorMessage("");
      setUserName(null);
      setReaderNumber(null);
      setScannedUid(null);

      const res = await fetch(`${API_BASE_URL}/attendance/request-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "web-session-1" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to request scan");

      setScanRequestId(data.requestId); // Set state only here; polling happens in useEffect
    } catch (err: any) {
      console.error("Failed to create scan request:", err);
      setErrorMessage(err.message || "Failed to initiate scan request");
      setNfcFailed(true);
    }
  };

  const startPollingScanStatus = (requestId: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/attendance/scan-status?requestId=${requestId}`);
        const data = await res.json();
        if (res.ok && data.success && data.status === "completed" && data.response) {
          const result = JSON.parse(data.response);
          setUserName(`${result.user.first_name} ${result.user.last_name}`);
          setReaderNumber(result.reader_number);
          setScannedUid(result.scannedUid);
          setNfcSuccess(true);
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        }
      } catch (err) {
        console.error("Polling scan status error:", err);
      }
    }, 2000);
  };

  const manualAttendance = async (student_id: string) => {
    const res = await fetch(`${API_BASE_URL}/attendance/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to record attendance");
    return data;
  };

  const handleManualInputClick = () => {
    setShowManualInput(true);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    setNfcFailed(false);
  };

  const handleManualConfirm = async () => {
    if (!manualIdInput.trim()) {
      setErrorMessage("Please enter an ID number");
      return;
    }
    try {
      const result = await manualAttendance(manualIdInput.trim());
      const fullName = `${result.user.first_name} ${result.user.last_name}`;
      setUserName(fullName);
      setReaderNumber(result.reader_number);
      setNfcSuccess(true);
      setShowManualInput(false);
      setNfcFailed(false);
    } catch (err: any) {
      console.error("❌ Manual attendance failed:", err);
      setErrorMessage(err.message || "Failed to record attendance");
      setNfcFailed(false);
      setShowManualInput(false);
    }
  };

  const handleCloseAll = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    setNfcFailed(false);
    setNfcSuccess(false);
    setShowManualInput(false);
    setScannedUid(null);
    setErrorMessage("");
    setUserName(null);
    setReaderNumber(null);
    setManualIdInput("");
    onClose();
  };

  const handleContinueBrowsing = () => {
    onSuccess?.(userName || "", readerNumber || 1);
    handleCloseAll();
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && handleCloseAll()}>
      {!nfcSuccess && !showManualInput && !nfcFailed && (
        <div className={styles.nfcCard}>
          <h2 className={styles.readyTitle}>Ready to Scan</h2>
          <div className={styles.nfcIcon}></div>
          <p className={styles.instruction}>Please scan your NFC card at the ESP32 kiosk</p>
          {scannedUid && <p className={styles.scannedUid}>Last Scanned UID: {scannedUid}</p>}
          <p className={styles.manualInputLink}>
            No physical ID? Input your student/faculty ID number{" "}
            <span className={styles.linkText} onClick={handleManualInputClick}>
              here
            </span>
          </p>
          <button className={styles.cancelButton} onClick={handleCloseAll}>Cancel</button>
        </div>
      )}

      {showManualInput && (
        <div className={styles.manualInputCard}>
          <h2 className={styles.manualTitle}>Input your ID Number Here</h2>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Student/Faculty ID No:</label>
            <input
              type="text"
              className={styles.manualInput}
              placeholder="Enter your ID number"
              value={manualIdInput}
              onChange={(e) => setManualIdInput(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.cancelButton} onClick={() => setShowManualInput(false)}>
              Cancel
            </button>
            <button className={styles.primaryButton} onClick={handleManualConfirm}>
              Confirm
            </button>
          </div>
        </div>
      )}

      {nfcFailed && !showManualInput && (
        <div className={styles.failCard}>
          <h2 className={styles.failTitle}>Scan Failed</h2>
          <p className={styles.failMessage}>{errorMessage || "Could not detect or verify card. Try again?"}</p>
          {scannedUid && <p className={styles.scannedUid}>Last UID: {scannedUid}</p>}
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={initiateScanRequest}>Try Again</button>
            <button className={styles.cancelButton} onClick={handleCloseAll}>Cancel</button>
          </div>
        </div>
      )}

      {nfcSuccess && (
        <div className={styles.modalContent}>
          <button className={styles.closeButton} onClick={handleCloseAll}>×</button>
          <div className={styles.contentWrapper}>
            <div className={styles.successIcon}>✅</div>
            <h2 className={styles.title}>Attendance Recorded</h2>
            <p className={styles.welcomeMessage}>Welcome, {userName}</p>
            <div className={styles.readerInfo}>📖 Reader #{readerNumber}</div>
            {scannedUid && <p className={styles.scannedUid}>Scanned UID: {scannedUid}</p>}
            <button className={styles.secondaryButton} onClick={handleContinueBrowsing}>
              Continue Browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceNFC;
