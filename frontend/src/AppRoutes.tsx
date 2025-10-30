import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
// pang modal itong line 4
import { createPortal } from 'react-dom'; 

//Pages
import PageNotFound from './pages/Landing/NotFound/PageNotFound';
import LandingPage from './pages/Landing/Home';



//Import OPAC Pages
import OPACLanding from './pages/OPAC/OPAC';

//import Patron Attendance Pages
import AttendanceNFC from './pages/PatronAttendance/AttendanceNFC';


//Import Return Book Pages




const AppRoutes: React.FC = () => {
  const location = useLocation();

  // @ts-ignore
  const state = location.state as { backgroundLocation?: Location };
  const background = state?.backgroundLocation;
  
    return (
        <>
            <Routes location={background || location}>
                {/* Landing Page Routes */}
                <Route path='*' element={<PageNotFound />} />
                <Route path="/" element={<LandingPage />} />

                {/* OPAC Page Routes */}
                <Route path="/open-public-access-catalog" element={<OPACLanding />} />


                {/* Patron Attendance Page Routes */}



                {/* Return Book Page Routes*/}




            </Routes>
            {/* modal pages */}
            {background && (
                <Routes>
                {/* Patron Attendance Page Routes */}
                <Route
                path="/patron-attendance/nfc"
                element={createPortal(
                    <AttendanceNFC
                    onClose={() => window.history.back()}
                    onSuccess={(userName, readerNumber) => {
                        console.log("✅ Attendance recorded for:", userName, "Reader #", readerNumber);
                        
                    }}
                    />,
                    document.body
                )}
                />

                {/* Return Book Page Routes*/}

                </Routes>
                )}
        </>
    );
};

export default AppRoutes;