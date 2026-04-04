import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { doctors as defaultDoctors, sampleAppointments } from '../data/dummyData';
import toast from 'react-hot-toast';

const GOOGLE_SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_WEBAPP_URL;

const AppContext = createContext();

export function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [demoMode, setDemoMode] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors] = useState(defaultDoctors);
  const [appointments, setAppointments] = useState([]);
  const [localAppointments, setLocalAppointments] = useState(() => {
    const saved = localStorage.getItem('medi_ai_local_apts');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingBooking, setPendingBooking] = useState(null);

  // Persist local appointments
  useEffect(() => {
    localStorage.setItem('medi_ai_local_apts', JSON.stringify(localAppointments));
  }, [localAppointments]);

  // Combined appointments list - Default sort by bookedAt (newest first for recent actions)
  const allAppointments = [...appointments, ...localAppointments].sort((a, b) => 
    new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0)
  );

  // Firestore Real-time Sync
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'appointments'), orderBy('bookedAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const apts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(apts);
      }, (error) => {
        console.error("Firestore snapshot error:", error);
        // Don't block app loading if Firestore fails
      });

      // Seed data if empty (for demo)
      const seedData = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, 'appointments'));
          if (querySnapshot.empty) {
            for (const apt of sampleAppointments) {
              await addDoc(collection(db, 'appointments'), {
                ...apt,
                id: undefined // Let Firestore generate ID
              });
            }
          }
        } catch (e) {
          console.error("Error seeding data:", e);
        }
      };
      seedData();
    } catch (e) {
      console.error("Firestore connection error:", e);
    }

    return () => unsubscribe();
  }, []);

  // Auth state listener - this is the primary gate for loading
  useEffect(() => {
    let authResolved = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          name: user.displayName || 'Demo User',
          email: user.email,
          phone: user.phoneNumber || '+91 98765 43210',
          avatar: (user.displayName || user.email).charAt(0).toUpperCase(),
        });
      } else {
        setCurrentUser(null);
      }
      authResolved = true;
      setLoading(false);
    });

    // Safety timeout: if auth doesn't resolve in 5 seconds, stop loading anyway
    // This prevents the white screen if Firebase is misconfigured or unreachable
    const timeout = setTimeout(() => {
      if (!authResolved) {
        console.warn("Auth state took too long to resolve. Proceeding without auth.");
        setLoading(false);
      }
    }, 5000);

    return () => { unsubscribe(); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const login = (userData) => {
    // Legacy support or for manual state updates
    if (userData) setCurrentUser(userData);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  /**
   * Syncs appointment data to Google Sheets via Web App URL
   * @param {Object} data - Appointment data
   */
  const syncToGoogleSheet = async (data) => {
    if (!GOOGLE_SHEET_URL) {
      console.warn("⚠️ Google Sheet Web App URL missing from .env. Sync disabled.");
      return;
    }

    console.log("📡 Attempting to sync booking to Google Sheets...", data.patientName);

    try {
      // Find doctor name for the sheet if not already included
      const doc = doctors.find(d => d.id === data.doctorId);
      const syncData = {
        ...data,
        doctorName: data.doctorName || (doc ? doc.name : 'Unknown Doctor'),
        appointmentType: data.appointmentType || 'Consultation'
      };

      // We use 'text/plain' to keep it as a "Simple Request" and avoid 
      // CORS preflight (OPTIONS) which Google Apps Script doesn't support.
      // mode: 'no-cors' sends the request but we won't see the response content.
      fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(syncData),
      });

      console.log("✅ Sync request sent to Google Sheets (no-cors mode). Check the sheet for data.");
    } catch (error) {
      console.error("❌ Error syncing to Google Sheet:", error);
    }
  };

  const bookAppointment = async (appointmentData) => {
    const newAptData = {
      ...appointmentData,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
      patientId: currentUser?.uid || 'guest',
    };
    try {
      const docRef = await addDoc(collection(db, 'appointments'), newAptData);
      const result = { id: docRef.id, ...newAptData };
      
      // SYNC TO GOOGLE SHEET (Don't wait for it to finish to avoid delaying UI)
      syncToGoogleSheet(result);
      
      toast.success("Appointment booked and synced! 🏥✅");
      return result;
    } catch (e) {
      console.error("Error booking to Firestore:", e);
      
      // PERSISTENT FALLBACK: Save locally if Firestore fails (Permission error, etc)
      const localId = `local_${Date.now()}`;
      const localApt = { id: localId, ...newAptData, isLocal: true };
      setLocalAppointments(prev => [localApt, ...prev]);
      
      // SYNC TO GOOGLE SHEET (Still attempt sync even if Firestore fails)
      syncToGoogleSheet(localApt);
      
      // More descriptive error message
      if (e.code === 'permission-denied') {
        toast.error("Database access denied! Please check Firestore Rules. 🛡️", { duration: 5000 });
      } else {
        toast.error("Database connection limited. Saved locally! 📱", { duration: 4000 });
      }
      
      return localApt;
    }
  };

  const cancelAppointment = async (aptId) => {
    const apt = allAppointments.find(a => a.id === aptId);
    if (!apt) return;

    if (aptId.startsWith('local_')) {
      setLocalAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status: 'cancelled' } : a));
    } else {
      try {
        const aptRef = doc(db, 'appointments', aptId);
        await updateDoc(aptRef, { status: 'cancelled' });
      } catch (e) {
        console.error("Error cancelling: ", e);
      }
    }
    
    // SYNC UPDATE TO GOOGLE SHEET
    syncToGoogleSheet({ ...apt, status: 'cancelled' });
  };

  const rescheduleAppointment = async (aptId, newDate, newTime) => {
    const apt = allAppointments.find(a => a.id === aptId);
    if (!apt) return;

    if (aptId.startsWith('local_')) {
      setLocalAppointments(prev => prev.map(a => a.id === aptId ? { ...a, date: newDate, time: newTime } : a));
    } else {
      try {
        const aptRef = doc(db, 'appointments', aptId);
        await updateDoc(aptRef, { date: newDate, time: newTime });
      } catch (e) {
        console.error("Error rescheduling: ", e);
      }
    }

    // SYNC UPDATE TO GOOGLE SHEET
    syncToGoogleSheet({ ...apt, date: newDate, time: newTime });
  };

  const getDoctorById = (id) => doctors.find(d => d.id === id);

  const getUpcomingAppointments = () => {
    // Use local date for "today" comparison to match user's perspective
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    
    return allAppointments
      .filter(a => (a.date >= todayStr) && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00')));
  };

  const getPastAppointments = () => {
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    
    return allAppointments
      .filter(a => (a.date < todayStr) || a.status === 'cancelled')
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
  };

  const value = {
    darkMode, setDarkMode,
    language, setLanguage,
    demoMode, setDemoMode,
    currentUser, login, logout,
    doctors,
    appointments: allAppointments,
    bookAppointment, cancelAppointment, rescheduleAppointment,
    pendingBooking, setPendingBooking,
    getDoctorById,
    getUpcomingAppointments, getPastAppointments,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
