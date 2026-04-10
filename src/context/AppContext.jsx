import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { doctors as defaultDoctors, sampleAppointments, DOCTOR_EMAIL_MAP } from '../data/dummyData';
import toast from 'react-hot-toast';

const GOOGLE_SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_WEBAPP_URL;

const AppContext = createContext();

export function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguageState] = useState(() => localStorage.getItem('i18nextLng') || 'en');
  
  const setLanguage = (lng) => {
    import('../i18n').then((module) => {
      module.default.changeLanguage(lng);
    });
    setLanguageState(lng);
    localStorage.setItem('i18nextLng', lng);
  };
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
  const [syncStatus, setSyncStatus] = useState('connecting'); // connecting, synced, error, limited
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [syncTrigger, setSyncTrigger] = useState(0);

  const refreshSync = () => {
    console.log("🔄 [Sync] Manual refresh triggered...");
    setSyncTrigger(prev => prev + 1);
    toast.loading("Refetching data...", { id: 'sync-toast' });
  };

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
    setSyncStatus('connecting');
    
    try {
      const q = query(collection(db, 'appointments'), orderBy('bookedAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const apts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const now = new Date().toLocaleTimeString();
        setLastSync(now);
        setSyncStatus('synced');
        setSyncError(null);
        
        console.log(`📊 [Sync] Data Received at ${now}: ${apts.length} appointments.`);
        toast.dismiss('sync-toast');
        
        if (apts.length === 0) {
          console.warn("⚠️ [Sync] The appointments collection is EMPTY in Firestore.");
        }
        
        setAppointments(apts);
      }, (error) => {
        console.error("🔥 [Sync] Firestore snapshot error:", error);
        setSyncStatus('error');
        setSyncError(error.message);
        toast.dismiss('sync-toast');

        if (error.code === 'permission-denied') {
          console.error("❌ [PERM] Access Denied! Please check Firestore Rules.");
          toast.error("Database access denied (Code 7). Check your permissions!", { duration: 6000 });
        } else {
          toast.error("Sync Error: " + error.code);
        }
      });

      // No auto-seeding here to keep things clean for cross-device sync testing
    } catch (e) {
      console.error("🔥 [Sync] Connection error:", e);
      setSyncStatus('error');
    }

    return () => unsubscribe();
  }, [syncTrigger]);

  // Auth state listener - this is the primary gate for loading
  useEffect(() => {
    let authResolved = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user profile from Firestore
        let role = 'patient'; // Default
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role || 'patient';
          } else {
            // New user or legacy user without profile, default to patient
            // We set it later if it's a first-time Google login via UI
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }

        // Link doctor accounts to their profile ID
        const normalizedEmail = (user.email || '').trim().toLowerCase();
        let doctorId = DOCTOR_EMAIL_MAP[normalizedEmail] || null;
        
        // If they have an email in the map, they are definitely a doctor
        if (doctorId) {
          role = 'doctor';
        }

        setCurrentUser({
          id: user.uid,
          name: user.displayName || 'Demo User',
          email: user.email,
          phone: user.phoneNumber || '+91 98765 43210',
          avatar: (user.displayName || user.email || 'U').charAt(0).toUpperCase(),
          role: role,
          doctorId: doctorId
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
      status: 'pending',
      bookedAt: new Date().toISOString(),
      patientId: currentUser?.id || 'guest',
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

  const updateAppointmentStatus = async (aptId, newStatus) => {
    const apt = allAppointments.find(a => a.id === aptId);
    if (!apt) return;

    if (aptId.startsWith('local_')) {
      setLocalAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status: newStatus } : a));
    } else {
      try {
        const aptRef = doc(db, 'appointments', aptId);
        await updateDoc(aptRef, { status: newStatus });
      } catch (e) {
        console.error("Error updating status: ", e);
      }
    }

    // SYNC UPDATE TO GOOGLE SHEET
    syncToGoogleSheet({ ...apt, status: newStatus });
    
    if (newStatus === 'confirmed') {
      toast.success("Appointment accepted! ✅");
    } else if (newStatus === 'rejected') {
      toast.error("Appointment rejected. ❌");
    }
  };

  const getDoctorById = (id) => doctors.find(d => d.id === id);

  const getUpcomingAppointments = () => {
    // Use local date for "today" comparison to match user's perspective
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    
    const userId = currentUser?.id || 'guest';
    return allAppointments
      .filter(a => a.patientId === userId && (a.date >= todayStr) && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00')));
  };

  const getPastAppointments = () => {
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    
    const userId = currentUser?.id || 'guest';
    return allAppointments
      .filter(a => a.patientId === userId && ((a.date < todayStr) || a.status === 'cancelled'))
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')));
  };

  const value = {
    darkMode, setDarkMode,
    language, setLanguage,
    demoMode, setDemoMode,
    currentUser, loading, login, logout,
    doctors,
    appointments: allAppointments,
    bookAppointment, cancelAppointment, rescheduleAppointment, updateAppointmentStatus,
    pendingBooking, setPendingBooking,
    getDoctorById,
    getUpcomingAppointments, getPastAppointments,
    syncStatus, lastSync, syncError, refreshSync
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
