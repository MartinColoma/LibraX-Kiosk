import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AttendanceNFC.module.css";

interface NFCReaderModalProps {
  onClose: () => void;
  onSuccess?: (userName: string, readerNumber: number) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AttendanceNFC: React.FC<NFCReaderModalProps> = ({ onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [isReading, setIsReading] = useState(true);
  const [nfcSuccess, setNfcSuccess] = useState(false);
  const [nfcFailed, setNfcFailed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [readerNumber, setReaderNumber] = useState<number | null>(null);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    startNfcReading();
  }, []);

  const scanAndLog = async (nfc_uid: string) => {
    console.log("📤 Sending to API:", nfc_uid);

    const apiUrl = `https://${API_BASE_URL}/api/attendance/record`;
    console.log("🌐 API URL:", apiUrl);

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nfc_uid }),
    });

    const data = await res.json();
    console.log("📥 API Response:", data);

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to record attendance");
    }
    return data;
  };

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
        console.log("✅ NFC scanning started...");

        ndef.onreading = async (event: any) => {
          const nfc_uid = event.serialNumber;
          setScannedUid(nfc_uid);
          console.log("🔹 NFC UID detected:", nfc_uid);
          console.log("🔹 Full event:", event);

          try {
            const result = await scanAndLog(nfc_uid);
            const fullName = `${result.user.first_name} ${result.user.last_name}`;
            setUserName(fullName);
            setReaderNumber(result.reader_number);
            setNfcSuccess(true);
            setIsReading(false);
            // Delay calling onSuccess until user clicks continue
            // onSuccess?.(fullName, result.reader_number);  <-- REMOVE here
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

  const simulateFallback = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const result = await scanAndLog("SIMULATED_UID_123");
      const fullName = `${result.user.first_name} ${result.user.last_name}`;
      setUserName(fullName);
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
    // Fire onSuccess now after confirmation
    onSuccess?.(userName || "", readerNumber || 1);
    handleCloseAll();
    navigate("/");
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
          <p className={styles.failMessage}>
            {errorMessage || "Could not detect or verify card. Try again?"}
          </p>
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
