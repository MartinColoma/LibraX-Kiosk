import React, { useState, useEffect, useRef } from "react";
import styles from "./AttendanceNFC.module.css";

interface NFCReaderModalProps {
  onClose: () => void;
  onSuccess?: (userName: string, readerNumber: number) => void;
}

const API_BASE_URL = "https://librax-kiosk-api.onrender.com";

const AttendanceNFC: React.FC<NFCReaderModalProps> = ({ onClose, onSuccess }) => {
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [scanRequestId, setScanRequestId] = useState<string | null>(null);
  const [nfcSuccess, setNfcSuccess] = useState(false);
  const [nfcFailed, setNfcFailed] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [readerNumber, setReaderNumber] = useState<number | null>(null);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [manualIdInput, setManualIdInput] = useState<string>("");

  // 🟢 Automatically request scan when modal opens
  const initialized = useRef(false);

useEffect(() => {
  if (!initialized.current) {
    initialized.current = true;
    initiateScanRequest();
  }

  return () => {
    cancelScanRequest();
  };
}, []);

  // 🟢 Start polling when scan request created
  useEffect(() => {
    if (scanRequestId) {
      startPollingScanStatus(scanRequestId);
    }
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [scanRequestId]);

    // 🧹 Clear any existing or stuck scan requests before starting a new one
  const clearOldScanRequests = async () => {
    try {
      console.log("🧹 Clearing old scan requests...");
      const res = await fetch(`${API_BASE_URL}/attendance/clear-old-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "web-session-1" }), // optional if you track by session
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        console.warn("⚠️ Failed to clear old requests:", data.message || "Unknown error");
      } else {
        console.log(`✅ Cleared ${data.clearedCount || 0} old requests`);
      }
    } catch (err) {
      console.warn("⚠️ Could not clear old requests:", err);
    }
  };

  const initiateScanRequest = async () => {
    try {
      setNfcSuccess(false);
      setNfcFailed(false);
      setErrorMessage("");
      setUserName(null);
      setReaderNumber(null);
      setScannedUid(null);

      // 🧹 Make sure no previous requests are pending before creating a new one
      await clearOldScanRequests();

      console.log("📡 Sending new scan request...");

      const res = await fetch(`${API_BASE_URL}/attendance/request-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "web-session-1" }),
      });

      const data = await res.json();
      console.log("🧾 Scan request response:", data);

      if (!res.ok || !data.success) throw new Error(data.message || "Failed to request scan");

      setScanRequestId(data.requestId);
      console.log(`✅ Scan request started. Request ID: ${data.requestId}`);
    } catch (err: any) {
      console.error("❌ Failed to create scan request:", err);
      setErrorMessage(err.message || "Failed to initiate scan request");
      setNfcFailed(true);
    }
  };


  const cancelScanRequest = async () => {
    if (!scanRequestId) return;
    try {
      console.log(`🛑 Cancelling scan request ID: ${scanRequestId}`);
      await fetch(`${API_BASE_URL}/attendance/cancel-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: scanRequestId }),
      });
    } catch (err) {
      console.warn("⚠️ Failed to cancel scan request (might already be cleared):", err);
    } finally {
      setScanRequestId(null);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    }
  };

  const startPollingScanStatus = (requestId: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    console.log("🔄 Starting polling for scan status...");

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/attendance/scan-status?requestId=${requestId}`);
        const data = await res.json();

        if (!res.ok || !data.success) return;

        const request = data.request;
        if (!request) return;

        if (request.status === "pending") {
          console.log("⏸️ Waiting for card scan...");
          return;
        }

        if (request.status === "completed" && request.response) {
          console.log("✅ Scan completed successfully!");
          try {
            const result = JSON.parse(request.response);
            if (result?.user) {
              const fullName = `${result.user.first_name} ${result.user.last_name}`;
              setUserName(fullName);
              setReaderNumber(result.reader_number);
              setScannedUid(result.scannedUid);
              setNfcSuccess(true);
              setNfcFailed(false);
              onSuccess?.(fullName, result.reader_number);
              console.log("🎉 Attendance recorded for:", fullName);
            } else {
              throw new Error("Invalid response data");
            }
          } catch (parseErr) {
            console.error("❌ Failed to parse response JSON:", parseErr);
            setErrorMessage("Failed to read scan data");
            setNfcFailed(true);
          }
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        }
      } catch (err) {
        console.error("⚠️ Polling scan status error:", err);
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

  // 🟡 When clicking "here" -> cancel scan & show manual input
  const handleManualInputClick = async () => {
    await cancelScanRequest();
    setShowManualInput(true);
    setNfcFailed(false);
  };

  // 🟢 Manual confirm
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

  // 🟡 Cancel inside manual input -> restart scanning
  const handleManualCancel = async () => {
    setShowManualInput(false);
    await initiateScanRequest();
  };

  // 🟥 Cancel whole modal
  const handleCloseAll = async () => {
    await cancelScanRequest();
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
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && handleCloseAll()}
    >
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
            <button className={styles.cancelButton} onClick={handleManualCancel}>
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
          <p className={styles.failMessage}>
            {errorMessage || "Could not detect or verify card. Try again?"}
          </p>
          {scannedUid && <p className={styles.scannedUid}>Last UID: {scannedUid}</p>}
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={initiateScanRequest}>
              Try Again
            </button>
            <button className={styles.cancelButton} onClick={handleCloseAll}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {nfcSuccess && (
        <div className={styles.modalContent}>
          <button className={styles.closeButton} onClick={handleCloseAll}>
            ×
          </button>
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
