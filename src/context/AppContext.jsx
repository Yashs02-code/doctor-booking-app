import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  doctors as defaultDoctors,
  sampleAppointments,
  DOCTOR_EMAIL_MAP,
} from "../data/dummyData";
import toast from "react-hot-toast";
import { sendBookingConfirmationEmail } from "../utils/emailNotification";
import { triggerPatientCall } from "../utils/callingAgent";
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getStoredGoogleToken,
} from "../utils/googleCalendar";

const GOOGLE_SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_WEBAPP_URL;

const AppContext = createContext();

export function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguageState] = useState(
    () => localStorage.getItem("i18nextLng") || "en",
  );

  const setLanguage = (lng) => {
    import("../i18n").then((module) => {
      module.default.changeLanguage(lng);
    });
    setLanguageState(lng);
    localStorage.setItem("i18nextLng", lng);
  };
  const [demoMode, setDemoMode] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors] = useState(defaultDoctors);
  const [appointments, setAppointments] = useState([]);
  const [localAppointments, setLocalAppointments] = useState(() => {
    const saved = localStorage.getItem("medi_ai_local_apts");
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingBooking, setPendingBooking] = useState(null);
  const [syncStatus, setSyncStatus] = useState("connecting"); // connecting, synced, error, limited
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [syncTrigger, setSyncTrigger] = useState(0);

  const refreshSync = () => {
    console.log("🔄 [Sync] Manual refresh triggered...");
    setSyncTrigger((prev) => prev + 1);
    toast.loading("Refetching data...", { id: "sync-toast" });
  };

  // Persist local appointments
  useEffect(() => {
    localStorage.setItem(
      "medi_ai_local_apts",
      JSON.stringify(localAppointments),
    );
  }, [localAppointments]);

  // Combined appointments list - Default sort by bookedAt (newest first for recent actions)
  const allAppointments = [...appointments, ...localAppointments].sort(
    (a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0),
  );

  // Firestore Real-time Sync
  useEffect(() => {
    // If not logged in, we can't query Firestore appointments due to security rules
    if (!currentUser) {
      setAppointments([]);
      setSyncStatus("connecting");
      return;
    }

    let unsubscribe = () => {};
    setSyncStatus("connecting");

    try {
      // Build query based on user role to satisfy firestore security rules
      let q;
      if (currentUser.role === "doctor") {
        const docId = currentUser.doctorId || currentUser.id;
        q = query(
          collection(db, "appointments"),
          where("doctorId", "==", docId),
        );
      } else {
        q = query(
          collection(db, "appointments"),
          where("patientId", "==", currentUser.id),
        );
      }

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const apts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort client-side to avoid needing to create Firestore composite indexes
          apts.sort(
            (a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0),
          );

          const now = new Date().toLocaleTimeString();
          setLastSync(now);
          setSyncStatus("synced");
          setSyncError(null);

          console.log(
            `📊 [Sync] Data Received at ${now}: ${apts.length} appointments.`,
          );
          toast.dismiss("sync-toast");

          if (apts.length === 0) {
            console.warn(
              "⚠️ [Sync] No appointments found for this user in Firestore.",
            );
          }

          setAppointments(apts);
        },
        (error) => {
          console.error("🔥 [Sync] Firestore snapshot error:", error);
          setSyncStatus("error");
          setSyncError(error.message);
          toast.dismiss("sync-toast");

          if (error.code === "permission-denied") {
            console.error(
              "❌ [PERM] Access Denied! Please check Firestore Rules.",
            );
            toast.error(
              "Database access denied (Code 7). Check your permissions!",
              { duration: 6000 },
            );
          } else {
            toast.error("Sync Error: " + error.code);
          }
        },
      );
    } catch (e) {
      console.error("🔥 [Sync] Connection error:", e);
      setSyncStatus("error");
    }

    return () => unsubscribe();
  }, [syncTrigger, currentUser]);

  // Auth state listener - this is the primary gate for loading
  useEffect(() => {
    let authResolved = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user profile from Firestore
        let role = "patient"; // Default
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role || "patient";
          } else {
            // New user or legacy user without profile, default to patient
            // We set it later if it's a first-time Google login via UI
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }

        // Check if user is an authorized doctor by email
        const normalizedEmail = (user.email || "").trim().toLowerCase();
        const doctorProfile = doctors.find((d) => d.email === normalizedEmail);

        if (doctorProfile) {
          role = "doctor";
        }

        setCurrentUser({
          id: user.uid,
          name: user.displayName || "Demo User",
          email: user.email,
          phone: user.phoneNumber || "+91 98765 43210",
          avatar: (user.displayName || user.email || "U")
            .charAt(0)
            .toUpperCase(),
          role: role,
          doctorId: doctorProfile?.id || null,
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
        console.warn(
          "Auth state took too long to resolve. Proceeding without auth.",
        );
        setLoading(false);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
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
      console.warn(
        "⚠️ Google Sheet Web App URL missing from .env. Sync disabled.",
      );
      return;
    }

    console.log(
      "📡 Attempting to sync booking to Google Sheets...",
      data.patientName,
    );

    try {
      // Find doctor name for the sheet if not already included
      const doc = doctors.find((d) => d.id === data.doctorId);
      const syncData = {
        ...data,
        doctorName: data.doctorName || (doc ? doc.name : "Unknown Doctor"),
        appointmentType: data.appointmentType || "Consultation",
      };

      // We use 'text/plain' to keep it as a "Simple Request" and avoid
      // CORS preflight (OPTIONS) which Google Apps Script doesn't support.
      // mode: 'no-cors' sends the request but we won't see the response content.
      fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(syncData),
      });

      console.log(
        "✅ Sync request sent to Google Sheets (no-cors mode). Check the sheet for data.",
      );
    } catch (error) {
      console.error("❌ Error syncing to Google Sheet:", error);
    }
  };

  const bookAppointment = async (appointmentData) => {
    // Find doctor email if not provided
    let doctorEmail = appointmentData.doctorEmail;
    if (!doctorEmail && appointmentData.doctorId) {
      const doc = doctors.find((d) => d.id === appointmentData.doctorId);
      doctorEmail = doc?.email;
    }

    const newAptData = {
      ...appointmentData,
      doctorId: appointmentData.doctorId || "d1",
      doctorName: appointmentData.doctorName || "Dr. Priya Sharma",
      doctorEmail: doctorEmail || "priya.sharma@example.com",
      status: "pending",
      bookedAt: new Date().toISOString(),
      patientId: currentUser?.id || "guest",
      patientEmail:
        appointmentData.patientEmail ||
        currentUser?.email ||
        appointmentData.email ||
        "",
    };

    // Helper: send confirmation email to patient
    const triggerConfirmationEmail = async (aptResult) => {
      const doctorObj =
        doctors.find((d) => d.id === aptResult.doctorId) || doctors[0];
      const targetEmail =
        aptResult.patientEmail || currentUser?.email || aptResult.email || "";

      if (targetEmail) {
        await sendBookingConfirmationEmail({
          toEmail: targetEmail,
          toName: aptResult.patientName || currentUser?.name || "Patient",
          doctorName:
            doctorObj?.name || aptResult.doctorName || "Dr. Priya Sharma",
          specialty: doctorObj?.specialty || "Cardiologist",
          date: aptResult.date,
          time: aptResult.time,
          hospital: doctorObj?.hospital || "Apollo Hospitals",
          location: doctorObj?.location || "Mumbai",
          appointmentType: aptResult.appointmentType,
          symptoms: aptResult.symptoms,
          bookingId: aptResult.id,
          fee: aptResult.fee || doctorObj?.fee,
        });
      } else {
        console.warn("⚠️ No email address available for booking confirmation");
      }
    };

    try {
      const docRef = await addDoc(collection(db, "appointments"), newAptData);
      const result = { id: docRef.id, ...newAptData };

      // Immediately update local appointments so Doctor Portal updates instantly
      setLocalAppointments((prev) => [result, ...prev]);

      // 1️⃣ SYNC TO GOOGLE SHEET (fire-and-forget)
      syncToGoogleSheet(result);

      // 2️⃣ SEND BREVO CONFIRMATION EMAIL (fire-and-forget)
      triggerConfirmationEmail(result).catch((err) =>
        console.error("Email notification error:", err),
      );

      // 3️⃣ TRIGGER OMNIDIMENSION AI CALLING AGENT (fire-and-forget)
      const doctorForCall = doctors.find((d) => d.id === result.doctorId) || doctors[0];
      triggerPatientCall({
        patientPhone: result.patientPhone || currentUser?.phone || currentUser?.mobile || "9876543210",
        patientName: result.patientName || currentUser?.name || "Patient",
        doctorName: doctorForCall?.name || result.doctorName || "Dr. Priya Sharma",
        specialty: doctorForCall?.specialty || "Cardiologist",
        date: result.date,
        time: result.time,
        hospital: doctorForCall?.hospital || "Apollo Hospitals",
        symptoms: result.symptoms,
        status: "pending",
        callType: "new_booking"
      }).catch((err) => console.error("AI Voice Call error:", err));

      // 4️⃣ AUTO-ADD TO PATIENT'S GOOGLE CALENDAR (fire-and-forget)
      const googleToken = getStoredGoogleToken();

      console.log("========== GOOGLE CALENDAR ==========");
      console.log("Stored Token:", googleToken);

      if (!googleToken) {
        console.error("❌ No Google Token Found");
      } else {
        const doctorObj =
          doctors.find((d) => d.id === result.doctorId) || doctors[0];

        console.log("Appointment:");
        console.log(result);

        console.log("Doctor:");
        console.log(doctorObj);

        const event = await createGoogleCalendarEvent(
          result,
          doctorObj,
          googleToken,
        );

        console.log("Returned Event:");
        console.log(event);

        if (event) {
          await updateDoc(doc(db, "appointments", result.id), {
            calendarEventId: event.id,
          });

          console.log("Saved Calendar Event ID:", event.id);
          toast.success("Calendar Event Created ✅");
        } else {
          toast.error("Calendar Event FAILED ❌");
        }
      }

      toast.success("Appointment booked and synced! 🏥✅");
      return result;
    } catch (e) {
      console.error("Error booking to Firestore:", e);

      // PERSISTENT FALLBACK
      const localId = `local_${Date.now()}`;
      const localApt = { id: localId, ...newAptData, isLocal: true };
      setLocalAppointments((prev) => [localApt, ...prev]);

      syncToGoogleSheet(localApt);
      triggerConfirmationEmail(localApt).catch((err) =>
        console.error("Email notification error (local):", err),
      );

      // Also try Google Calendar even for local appointments
      const googleToken = getStoredGoogleToken();
      if (googleToken) {
        const doctorObj = doctors.find((d) => d.id === localApt.doctorId);
        createGoogleCalendarEvent(localApt, doctorObj, googleToken).catch(
          console.error,
        );
      }

      if (e.code === "permission-denied") {
        toast.error(
          "Database access denied! Please check Firestore Rules. 🛡️",
          { duration: 5000 },
        );
      } else {
        toast.error("Database connection limited. Saved locally! 📱", {
          duration: 4000,
        });
      }

      return localApt;
    }
  };

  const cancelAppointment = async (aptId) => {
    const apt = allAppointments.find((a) => a.id === aptId);
    if (!apt) return;

    if (aptId.startsWith("local_")) {
      setLocalAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, status: "cancelled" } : a)),
      );
    } else {
      try {
        const aptRef = doc(db, "appointments", aptId);
        await updateDoc(aptRef, { status: "cancelled" });
      } catch (e) {
        console.error("Error cancelling: ", e);
      }
    }

    // SYNC UPDATE TO GOOGLE SHEET
    syncToGoogleSheet({ ...apt, status: "cancelled",calendarEventId:null});

    const googleToken = getStoredGoogleToken();

if (
    googleToken &&
    apt.calendarEventId
) {
    await deleteGoogleCalendarEvent(
        apt.calendarEventId,
        googleToken
    );

    console.log("Calendar Event Deleted");
}
  };

  const rescheduleAppointment = async (aptId, newDate, newTime) => {
    const apt = allAppointments.find((a) => a.id === aptId);
    if (!apt) return;

    if (aptId.startsWith("local_")) {
      setLocalAppointments((prev) =>
        prev.map((a) =>
          a.id === aptId ? { ...a, date: newDate, time: newTime } : a,
        ),
      );
    } else {
      try {
        const aptRef = doc(db, "appointments", aptId);
        await updateDoc(aptRef, { date: newDate, time: newTime });
      } catch (e) {
        console.error("Error rescheduling: ", e);
      }
    }

    // SYNC UPDATE TO GOOGLE SHEET
    syncToGoogleSheet({ ...apt, date: newDate, time: newTime });
  };

  const updateAppointmentStatus = async (aptId, newStatus) => {
    const apt = allAppointments.find((a) => a.id === aptId);
    if (!apt) return;

    // Update Firestore or local state
    if (aptId.startsWith("local_")) {
      setLocalAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, status: newStatus } : a)),
      );
    } else {
      try {
        const aptRef = doc(db, "appointments", aptId);
        await updateDoc(aptRef, { status: newStatus });
      } catch (e) {
        console.error("Error updating status: ", e);
        // Also update local state so UI reflects change even if Firestore fails
        setLocalAppointments((prev) => {
          const exists = prev.find((a) => a.id === aptId);
          if (exists)
            return prev.map((a) =>
              a.id === aptId ? { ...a, status: newStatus } : a,
            );
          return [{ ...apt, status: newStatus }, ...prev];
        });
      }
    }

    // Also force-update the Firestore appointments array in local state for instant UI
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status: newStatus } : a)),
    );

    // SYNC UPDATE TO GOOGLE SHEET
    syncToGoogleSheet({ ...apt, status: newStatus, calendarEventId:null });

    const googleToken = getStoredGoogleToken();

if (
  googleToken &&
  apt.calendarEventId &&
  newStatus === "confirmed"
) {
  const doctorObj =
    doctors.find((d) => d.id === apt.doctorId) || doctors[0];

  const updatedAppointment = {
    id: apt.id,
    patientId: apt.patientId,
    patientName: apt.patientName,
    patientEmail: apt.patientEmail,
    doctorId: apt.doctorId,
    doctorName: apt.doctorName,
    doctorEmail: apt.doctorEmail,
    appointmentType: apt.appointmentType,
    symptoms: apt.symptoms,
    date: apt.date,
    time: apt.time,
    fee: apt.fee,
    bookedAt: apt.bookedAt,
    calendarEventId: apt.calendarEventId,
    status: newStatus,
  };

  await updateGoogleCalendarEvent(
    apt.calendarEventId,
    googleToken,
    updatedAppointment,
    doctorObj
  );

  console.log("✅ Calendar updated after doctor approval");
}

    if (newStatus === "confirmed") {
      toast.success("Appointment accepted! ✅");
      // Send acceptance confirmation email to patient
      const doctorObj =
        doctors.find((d) => d.id === apt.doctorId) || doctors[0];
      const patientEmail = apt.patientEmail || apt.email || "";
      if (patientEmail) {
        sendBookingConfirmationEmail({
          toEmail: patientEmail,
          toName: apt.patientName || "Patient",
          doctorName: doctorObj?.name || apt.doctorName || "Dr. Priya Sharma",
          specialty: doctorObj?.specialty || "Cardiologist",
          date: apt.date,
          time: apt.time,
          hospital: doctorObj?.hospital || "Apollo Hospitals",
          location: doctorObj?.location || "Mumbai",
          appointmentType: apt.appointmentType,
          symptoms: apt.symptoms,
          bookingId: apt.id,
          fee: apt.fee || doctorObj?.fee,
          isConfirmed: true,
        }).catch((err) => console.error("Acceptance email error:", err));
      }

      // Trigger Omnidimension AI voice call confirmation to patient
      triggerPatientCall({
        patientPhone: apt.patientPhone || apt.phone || apt.mobile || "9876543210",
        patientName: apt.patientName || "Patient",
        doctorName: doctorObj?.name || apt.doctorName || "Dr. Priya Sharma",
        specialty: doctorObj?.specialty || "Cardiologist",
        date: apt.date,
        time: apt.time,
        hospital: doctorObj?.hospital || "Apollo Hospitals",
        symptoms: apt.symptoms,
        status: "confirmed",
        callType: "doctor_approval_confirmation"
      }).catch((err) => console.error("Acceptance AI Call error:", err));
    } else if (newStatus === "rejected") {
      toast.error("Appointment rejected. ❌");
    }
  };

  const getDoctorById = (id) => doctors.find((d) => d.id === id);

  const getUpcomingAppointments = () => {
    // Use local date for "today" comparison to match user's perspective
    const now = new Date();
    const todayStr =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    const userId = currentUser?.id || "guest";
    return allAppointments
      .filter(
        (a) =>
          a.patientId === userId &&
          a.date >= todayStr &&
          a.status !== "cancelled",
      )
      .sort(
        (a, b) =>
          new Date(a.date + " " + (a.time || "00:00")) -
          new Date(b.date + " " + (b.time || "00:00")),
      );
  };

  const getPastAppointments = () => {
    const now = new Date();
    const todayStr =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    const userId = currentUser?.id || "guest";
    return allAppointments
      .filter(
        (a) =>
          a.patientId === userId &&
          (a.date < todayStr || a.status === "cancelled"),
      )
      .sort(
        (a, b) =>
          new Date(b.date + " " + (b.time || "00:00")) -
          new Date(a.date + " " + (a.time || "00:00")),
      );
  };

  // NEW: Dynamically compute doctors with their updated bookedSlots based on real-time appointments
  const doctorsWithSlots = React.useMemo(() => {
    return defaultDoctors.map((doc) => {
      // Start with static booked slots from dummyData
      const dynamicBookedSlots = { ...(doc.bookedSlots || {}) };

      // Add actual appointments from DB/Local
      allAppointments.forEach((apt) => {
        if (apt.doctorId === doc.id && apt.status !== "cancelled") {
          if (!dynamicBookedSlots[apt.date]) {
            dynamicBookedSlots[apt.date] = [];
          }
          if (!dynamicBookedSlots[apt.date].includes(apt.time)) {
            dynamicBookedSlots[apt.date].push(apt.time);
          }
        }
      });

      return { ...doc, bookedSlots: dynamicBookedSlots };
    });
  }, [allAppointments]);

  const value = {
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    demoMode,
    setDemoMode,
    currentUser,
    loading,
    login,
    logout,
    doctors: doctorsWithSlots, // Use the dynamic list
    appointments: allAppointments,
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment,
    updateAppointmentStatus,
    pendingBooking,
    setPendingBooking,
    getDoctorById,
    getUpcomingAppointments,
    getPastAppointments,
    syncStatus,
    lastSync,
    syncError,
    refreshSync,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
