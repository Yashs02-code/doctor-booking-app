import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { doctors as defaultDoctors, sampleAppointments } from '../data/dummyData';

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

  // Combined appointments list
  const allAppointments = [...appointments, ...localAppointments].sort((a,b) => 
    new Date(b.bookedAt) - new Date(a.bookedAt)
  );

  // Firestore Real-time Sync
  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('bookedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(apts);
      setLoading(false);
    });

    // Seed data if empty (for demo)
    const seedData = async () => {
      const querySnapshot = await getDocs(collection(db, 'appointments'));
      if (querySnapshot.empty) {
        for (const apt of sampleAppointments) {
          await addDoc(collection(db, 'appointments'), {
            ...apt,
            id: undefined // Let Firestore generate ID
          });
        }
      }
    };
    seedData();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
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
      setLoading(false);
    });

    return () => unsubscribe();
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

  const bookAppointment = async (appointmentData) => {
    const newAptData = {
      ...appointmentData,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
      patientId: currentUser?.uid || 'guest',
    };
    try {
      const docRef = await addDoc(collection(db, 'appointments'), newAptData);
      return { id: docRef.id, ...newAptData };
    } catch (e) {
      console.error("Error booking to Firestore:", e);
      // PERSISTENT FALLBACK: Save locally if Firestore fails (Permission error, etc)
      const localId = `local_${Date.now()}`;
      const localApt = { id: localId, ...newAptData, isLocal: true };
      setLocalAppointments(prev => [localApt, ...prev]);
      toast.error("Database connection limited. Saved to local demo mode! 📱", { duration: 4000 });
      return localApt;
    }
  };

  const cancelAppointment = async (aptId) => {
    if (aptId.startsWith('local_')) {
      setLocalAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status: 'cancelled' } : a));
      return;
    }
    try {
      const aptRef = doc(db, 'appointments', aptId);
      await updateDoc(aptRef, { status: 'cancelled' });
    } catch (e) {
      console.error("Error cancelling: ", e);
    }
  };

  const rescheduleAppointment = async (aptId, newDate, newTime) => {
    if (aptId.startsWith('local_')) {
      setLocalAppointments(prev => prev.map(a => a.id === aptId ? { ...a, date: newDate, time: newTime } : a));
      return;
    }
    try {
      const aptRef = doc(db, 'appointments', aptId);
      await updateDoc(aptRef, { date: newDate, time: newTime });
    } catch (e) {
      console.error("Error rescheduling: ", e);
    }
  };

  const getDoctorById = (id) => doctors.find(d => d.id === id);

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return allAppointments.filter(a => a.date >= today && a.status !== 'cancelled');
  };

  const getPastAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return allAppointments.filter(a => a.date < today || a.status === 'cancelled');
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
