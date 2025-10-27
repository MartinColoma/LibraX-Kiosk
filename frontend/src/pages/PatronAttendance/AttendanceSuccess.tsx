import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AttendanceSuccess.module.css';

interface AttendanceModalProps {
  onClose: () => void;
  userName?: string;
  readerNumber?: number;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  onClose,
  userName = "Juan Dela Cruz", // Default value for demo
  readerNumber = 23 // Default value for demo
}) => {
  const navigate = useNavigate();

  const handleViewDashboard = () => {
    onClose();
    navigate('/member/dashboard');
  };

  const handleContinueBrowsing = () => {
    onClose();
    navigate('/');
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        
        <div className={styles.contentWrapper}>
          <div className={styles.successIcon}>
            ✅
          </div>
          
          <h2 className={styles.title}>
            Attendance Recorded
          </h2>
          
          <p className={styles.welcomeMessage}>
            Welcome, {userName}
          </p>
          
          <div className={styles.readerInfo}>
            📖 You are Reader #{readerNumber} today
          </div>
          
          <div className={styles.buttonGroup}>
            <button 
              className={styles.primaryButton}
              onClick={handleViewDashboard}
            >
              View My Dashboard
            </button>
            
            <button 
              className={styles.secondaryButton}
              onClick={handleContinueBrowsing}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;