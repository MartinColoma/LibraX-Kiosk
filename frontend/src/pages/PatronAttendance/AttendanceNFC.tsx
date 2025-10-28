import React, { useState, useEffect, useRef } from "react";
//import { useNavigate } from "react-router-dom";
import styles from "./AttendanceNFC.module.css";

interface NFCReaderModalProps {
  onClose: () => void;
  onSuccess?: (userName: string, readerNumber: number) => void;
}

// Render API base URL
const API_BASE_URL = "https://librax-kiosk-api.onrender.com";

const AttendanceNFC: React.FC<NFCReaderModalProps> = ({ onClose, onSuccess }) => {
  //const navigate = useNavigate();
  const [isReading, setIsReading] = useState(true);
  const [nfcSuccess, setNfcSuccess] = useState(false);
  const [nfcFailed, setNfcFailed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [readerNumber, setReaderNumber] = useState<number | null>(null);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Ref to prevent duplicate scans
  const lastScannedRef = useRef<{ uid: string; timestamp: number } | null>(null);

  useEffect(() => {
    startNfcReading();
  }, []);

  // Call Render API
  const scanAndLog = async (nfc_uid: string) => {
    const apiUrl = `${API_BASE_URL}/attendance/record`;
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nfc_uid }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to record attendance");
    return data;
  };

  // Start NFC reading
  const startNfcReading = async () => {
    setIsReading(true);
    setNfcSuccess(false);
    setNfcFailed(false);
    setScannedUid(null);
    setErrorMessage("");

    try {
      if ("NDEFReader" in window) {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();

        ndef.onreading = async (event: any) => {
          const nfc_uid = event.serialNumber;

          // Prevent duplicates within 2 seconds
          const now = Date.now();
          if (lastScannedRef.current && lastScannedRef.current.uid === nfc_uid && now - lastScannedRef.current.timestamp < 2000) {
            console.log("Duplicate scan ignored:", nfc_uid);
            return;
          }
          lastScannedRef.current = { uid: nfc_uid, timestamp: now };


          setScannedUid(nfc_uid);
          try {
            const result = await scanAndLog(nfc_uid);
            const fullName = `${result.user.first_name} ${result.user.last_name}`;
            setUserName(fullName);
            setReaderNumber(result.reader_number);
            setNfcSuccess(true);
            setIsReading(false);
          } catch (err: any) {
            console.error("❌ Scan or log failed:", err);
            setErrorMessage(err.message || "Unknown error");
            setNfcFailed(true);
            setIsReading(false);
          }
        };

        ndef.onreadingerror = (error: any) => {
          console.error("❌ NFC reading error:", error);
          setErrorMessage("NFC reading error");
          setNfcFailed(true);
          setIsReading(false);
        };
      } else {
        console.warn("⚠️ Web NFC not supported — simulating...");
        await simulateFallback();
      }
    } catch (error: any) {
      console.error("❌ NFC init failed:", error);
      setErrorMessage(error.message || "Failed to initialize NFC");
      setNfcFailed(true);
      setIsReading(false);
    }
  };

  // Fallback for unsupported devices
  const simulateFallback = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const result = await scanAndLog("SIMULATED_UID_123");
      setUserName(`${result.user.first_name} ${result.user.last_name}`);
      setReaderNumber(result.reader_number);
      setScannedUid(result.scannedUid);
      setNfcSuccess(true);
    } catch (err: any) {
      console.error("❌ Simulation failed:", err);
      setErrorMessage(err.message || "Simulation failed");
      setNfcFailed(true);
    }
    setIsReading(false);
  };

  const handleCloseAll = () => {
    setNfcFailed(false);
    setNfcSuccess(false);
    setScannedUid(null);
    setErrorMessage("");
    setUserName(null);
    setReaderNumber(null);
    onClose();
  };

  const handleContinueBrowsing = () => {
    onSuccess?.(userName || "", readerNumber || 1);
    handleCloseAll();
    // navigate("/");
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && handleCloseAll()}>
      {isReading && !nfcSuccess && !nfcFailed && (
        <div className={styles.nfcCard}>
          <h2 className={styles.readyTitle}>Ready to Scan</h2>
          <div className={styles.nfcIcon}></div>
          <p className={styles.instruction}>Tap your NFC card to record attendance</p>
          {scannedUid && <p className={styles.scannedUid}>Scanned UID: {scannedUid}</p>}
          <button className={styles.cancelButton} onClick={handleCloseAll}>Cancel</button>
        </div>
      )}

      {nfcFailed && (
        <div className={styles.failCard}>
          <h2 className={styles.failTitle}>Scan Failed</h2>
          <p className={styles.failMessage}>{errorMessage || "Could not detect or verify card. Try again?"}</p>
          {scannedUid && <p className={styles.scannedUid}>Last UID: {scannedUid}</p>}
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={startNfcReading}>Try Again</button>
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
