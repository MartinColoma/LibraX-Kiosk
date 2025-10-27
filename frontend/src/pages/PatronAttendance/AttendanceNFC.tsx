import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AttendanceNFC.module.css";

interface NFCReaderModalProps {
  onClose: () => void;
  onSuccess?: (userName: string, readerNumber: number) => void;
}

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

  const startNfcReading = async () => {
    setIsReading(true);
    setNfcSuccess(false);
    setNfcFailed(false);

    try {
      // Check if Web NFC is available
      if ("NDEFReader" in window) {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();

        console.log("✅ NFC scanning started...");

        ndef.onreading = (event: any) => {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            const payload = decoder.decode(record.data);
            console.log("🔹 NFC payload:", payload);

            // Parse or process payload
            const fakeUser = {
              name: payload || "Juan Dela Cruz",
              readerNo: Math.floor(Math.random() * 100),
            };

            setUserName(fakeUser.name);
            setReaderNumber(fakeUser.readerNo);
            onSuccess?.(fakeUser.name, fakeUser.readerNo);
            setNfcSuccess(true);
            setIsReading(false);
          }
        };

        ndef.onreadingerror = () => {
          console.error("❌ NFC read error");
          setNfcFailed(true);
          setIsReading(false);
        };
      } else {
        console.warn("⚠️ Web NFC not supported. Using simulation.");
        await simulateNfcFallback();
      }
    } catch (error) {
      console.error("❌ NFC init failed:", error);
      setNfcFailed(true);
      setIsReading(false);
    }
  };

  // Fallback for unsupported browsers
  const simulateNfcFallback = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate 70% success rate
    const success = Math.random() < 0.7;

    if (success) {
      const fakeUser = { name: "Juan Dela Cruz", readerNo: 42 };
      setUserName(fakeUser.name);
      setReaderNumber(fakeUser.readerNo);
      onSuccess?.(fakeUser.name, fakeUser.readerNo);
      setNfcSuccess(true);
    } else {
      setNfcFailed(true);
    }

    setIsReading(false);
  };

  const handleCloseAll = () => {
    setNfcFailed(false);
    setNfcSuccess(false);
    onClose();
  };

  const handleViewDashboard = () => {
    handleCloseAll();
    navigate("/member/dashboard");
  };

  const handleContinueBrowsing = () => {
    handleCloseAll();
    navigate("/");
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && handleCloseAll()}>
      {/* 🔹 Reading */}
      {isReading && !nfcSuccess && !nfcFailed && (
        <div className={styles.nfcCard}>
          <h2 className={styles.readyTitle}>Ready to Scan</h2>
          <div className={styles.nfcIcon}></div>
          <p className={styles.instruction}>Tap your NFC ID card to record attendance</p>
          <button className={styles.cancelButton} onClick={handleCloseAll}>Cancel</button>
        </div>
      )}

      {/* 🔹 Failed */}
      {nfcFailed && (
        <div className={styles.failCard}>
          <h2 className={styles.failTitle}>Scan Failed</h2>
          <div className={styles.failIcon}></div>
          <p className={styles.failMessage}>Card scanning failed. Do you want to try again?</p>
          <div className={styles.buttonGroup}>
            <button className={styles.primaryButton} onClick={startNfcReading}>Try Again</button>
            <button className={styles.cancelButton} onClick={handleCloseAll}>Cancel</button>
          </div>
        </div>
      )}

      {/* 🔹 Success */}
      {nfcSuccess && (
        <div className={styles.modalContent}>
          <button className={styles.closeButton} onClick={handleCloseAll} aria-label="Close modal">×</button>

          <div className={styles.contentWrapper}>
            <div className={styles.successIcon}>✅</div>
            <h2 className={styles.title}>Attendance Recorded</h2>
            <p className={styles.welcomeMessage}>Welcome, {userName}</p>
            <div className={styles.readerInfo}>📖 You are Reader #{readerNumber} today</div>

            <div className={styles.buttonGroup}>
              <button className={styles.primaryButton} onClick={handleViewDashboard}>
                View My Dashboard
              </button>
              <button className={styles.secondaryButton} onClick={handleContinueBrowsing}>
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceNFC;
