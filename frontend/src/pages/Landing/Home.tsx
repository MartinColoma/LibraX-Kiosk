import styles from './Home.module.css';
import libraryCover from '../../assets/images/library_cover1.jpg';
import usePageMeta from '../../hooks/usePageMeta';
import AttendanceNFC from '../PatronAttendance/AttendanceNFC';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LibraXKiosk() {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Correctly get the React Router location

  usePageMeta("LibraX | AIoT Library Kiosk", "LibraX Square Logo 1.png");

  // Check if we’re currently at the attendance modal route
  const attendance_nfc = location.pathname === '/patron-attendance/nfc';

  return (
    <div className={styles.kioskContainer}>
      <div
        className={styles.libraryImage}
        style={{ backgroundImage: `url(${libraryCover})` }}
      >
        <div className={styles.imageOverlay} />
      </div>

      <div className={styles.kioskPanel}>
        <div className={styles.contentWrapper}>
          <div className={styles.centerBlock}>
            <h1 className={styles.logo}>LibraX</h1>
            <h2 className={styles.subtitle}>AIoT Library Kiosk</h2>

            <div className={styles.buttonContainer}>
              {/* OPAC Button */}
              <button
                className={`${styles.kioskButton} ${styles.primary}`}
                onClick={() => navigate('/open-public-access-catalog')}
              >
                OPEN PUBLIC<br />ACCESS CATALOG
              </button>

              {/* Attendance Button */}
              <button
                className={`${styles.kioskButton} ${styles.secondary}`}
                onClick={() =>
                  navigate('/patron-attendance/nfc', {
                    state: { backgroundLocation: location }, // ✅ Now works correctly
                  })
                }
              >
                PATRON ATTENDANCE
              </button>

              {/* Return Books Button */}
              <button onClick={() => navigate('/return-books')}>
                RETURN BOOK/S
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      {attendance_nfc && (
        <AttendanceNFC
          onClose={() =>
            navigate(
              (location.state as { backgroundLocation?: Location })?.backgroundLocation || '/'
            )
          }
        />
      )}
    </div>
  );
}
