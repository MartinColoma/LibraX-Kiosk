import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AttendanceNFC.module.css";

interface NFCReaderModalProps {
  onClose: () => void;
  onSuccess?: (userName: string, readerNumber: number) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.startsWith("http")
  ? import.meta.env.VITE_API_BASE_URL
  : `https://${import.meta.env.VITE_API_BASE_URL}`;

const AttendanceNFC: React.FC<NFCReaderModalProps> = ({ onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [isReading, setIsReading] = useState(true);
  const [nfcSuccess, setNfcSuccess] = useState(false);
  const [nfcFailed, setNfcFailed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [readerNumber, setReaderNumber] = useState<number | null>(null);

  useEffect(() => {
    startNfcReading();
  }, []);

  // ✅ Step 1: Scan API (verify user)
  const scanUser = async (nfc_uid: string) => {
    const res = await fetch(`${API_BASE_URL}/api/attendance/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nfc_uid }),
    });

    if (!res.ok) throw new Error(`Scan API responded with ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "User not found");

    return data.user; // { user_id, first_name, last_name, role, nfc_uid }
  };

  // ✅ Step 2: Log API (insert attendance)
  const logAttendance = async (user_id: string, nfc_uid: string, reader_number: number) => {
    const res = await fetch(`${API_BASE_URL}/api/attendance/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, nfc_uid, reader_number }),
    });

    if (!res.ok) throw new Error(`Log API responded with ${res.status}`);
    return await res.json();
  };

  const startNfcReading = async () => {
    setIsReading(true);
    setNfcSuccess(false);
    setNfcFailed(false);

    try {
      if ("NDEFReader" in window) {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
        console.log("✅ NFC scanning started...");

        ndef.onreading = async (event: any) => {
          const decoder = new TextDecoder();

          for (const record of event.message.records) {
            const nfc_uid = decoder.decode(record.data).trim();
            console.log("🔹 NFC UID detected:", nfc_uid);

            try {
              // Step 1: Verify user
              const user = await scanUser(nfc_uid);

              // Step 2: Log attendance
              const reader_number = Math.floor(Math.random() * 100);
              await logAttendance(user.user_id, user.nfc_uid, reader_number);

              // Update UI
              setUserName(`${user.first_name} ${user.last_name}`);
              setReaderNumber(reader_number);
              setNfcSuccess(true);
              setIsReading(false);

              onSuccess?.(`${user.first_name} ${user.last_name}`, reader_number);
            } catch (err) {
              console.error("❌ Scan or log failed:", err);
              setNfcFailed(true);
              setIsReading(false);
            }
          }
        };

        ndef.onreadingerror = () => {
          console.error("❌ NFC reading error");
          setNfcFailed(true);
          setIsReading(false);
        };
      } else {
        console.warn("⚠️ Web NFC not supported — simulating...");
        await simulateNfcFallback();
      }
    } catch (error) {
      console.error("❌ NFC init failed:", error);
      setNfcFailed(true);
      setIsReading(false);
    }
  };

  // 🧩 Fallback Simulation
  const simulateNfcFallback = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const user = await scanUser("SIMULATED_UID_123");
      const reader_number = 42;
      await logAttendance(user.user_id, user.nfc_uid, reader_number);

      setUserName(`${user.first_name} ${user.last_name}`);
      setReaderNumber(reader_number);
      setNfcSuccess(true);
    } catch {
      setNfcFailed(true);
    }

    setIsReading(false);
  };

  const handleCloseAll = () => {
    setNfcFailed(false);
    setNfcSuccess(false);
    onClose();
  };

  const handleContinueBrowsing = () => {
    handleCloseAll();
    navigate("/");
  };

  // === UI rendering below stays same ===
  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && handleCloseAll()}
    >
      {isReading && !nfcSuccess && !nfcFailed && (
        <div className={styles.nfcCard}>
          <h2 className={styles.readyTitle}>Ready to Scan</h2>
          <div className={styles.nfcIcon}></div>
          <p className={styles.instruction}>Tap your NFC card to record attendance</p>
          <button className={styles.cancelButton} onClick={handleCloseAll}>Cancel</button>
        </div>
      )}

      {nfcFailed && (
        <div className={styles.failCard}>
          <h2 className={styles.failTitle}>Scan Failed</h2>
          <p className={styles.failMessage}>Could not detect or verify card. Try again?</p>
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
            <div className={styles.readerInfo}>📖 You are Reader #{readerNumber}</div>
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
