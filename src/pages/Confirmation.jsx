import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import SkeletonLoader from '../components/SkeletonLoader';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Clock, MapPin, Home, Share2, ArrowRight } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import ConfettiWrapper from '../components/ConfettiWrapper';
import NotificationBanner from '../components/NotificationBanner';

export default function Confirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode, appointments, getDoctorById, loading: contextLoading } = useApp();
  const [showConfetti, setShowConfetti] = useState(true);
  const [localApt, setLocalApt] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchApt = async () => {
      // First check local state
      const found = appointments.find(a => a.id === id);
      if (found) {
        setLocalApt(found);
        setFetching(false);
        return;
      }

      // Fallback: fetch directly from Firestore
      try {
        const docRef = doc(db, 'appointments', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLocalApt({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchApt();
  }, [id, appointments]);

  useEffect(() => {
    if (localApt) {
      toast.success('Booking Successful! 🎉', { duration: 4000 });
    }
  }, [localApt]);

  const apt = localApt;
  const docData = apt ? getDoctorById(apt.doctorId) : null;

  if (fetching || (contextLoading && !apt)) {
    return (
      <PageWrapper>
        <div style={{ padding: '100px 24px', maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
          <SkeletonLoader count={1} />
          <p style={{ marginTop: 20, color: '#64748b' }}>Confirming your appointment...</p>
        </div>
      </PageWrapper>
    );
  }

  if (!apt || !docData) {
    return (
      <PageWrapper>
        <div style={{ padding: '100px 24px', maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>❓</div>
          <h2 style={{ color: darkMode ? '#e2e8f0' : '#0f172a' }}>Appointment Not Found</h2>
          <p style={{ color: '#64748b', marginTop: 10 }}>We couldn't find the appointment details. Please check your bookings list.</p>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/appointments')}
            style={{
              marginTop: 30, padding: '12px 24px', borderRadius: 12, border: 'none',
              background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Go to My Bookings
          </motion.button>
        </div>
      </PageWrapper>
    );
  }

  const doc = docData;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Doctor Appointment Confirmed',
        text: `I've booked an appointment with ${doc.name} on ${apt.date} at ${apt.time} via MediAI!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      toast('Copied to clipboard!');
    }
  };

  return (
    <PageWrapper>
      {showConfetti && <ConfettiWrapper />}
      <NotificationBanner 
        type="push" 
        message={`Your appointment with ${doc.name} is confirmed for ${apt.time} on ${apt.date}.`} 
        duration={6000}
      />
      <NotificationBanner 
        type="sms" 
        message={`MediAI: Hi ${apt.patientName}, your appointment with ${doc.name} is confirmed. Location: ${doc.hospital}.`} 
        duration={5000}
      />

      <div style={{ padding: '40px 24px', maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 20px 40px rgba(16,185,129,0.3)',
          }}
        >
          <CheckCircle size={56} color="white" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: 32, fontWeight: 900, color: darkMode ? '#e2e8f0' : '#0f172a', marginBottom: 12 }}
        >
          Booking Confirmed!
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ color: '#64748b', fontSize: 16, marginBottom: 40 }}
        >
          Your appointment has been successfully scheduled. We've sent the details to your email and phone.
        </motion.p>

        {/* Appointment Card */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            background: darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(30px)',
            borderRadius: 24, padding: 32, textAlign: 'left',
            border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.2)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `linear-gradient(135deg, ${doc.avatarColor}, ${doc.avatarColor}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 18, flexShrink: 0
            }}>
              {doc.avatar}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: darkMode ? '#e2e8f0' : '#0f172a' }}>{doc.name}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>{doc.specialty}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Calendar size={18} color="#2563eb" />
              <div style={{ fontSize: 15, fontWeight: 600, color: darkMode ? '#cbd5e1' : '#475569' }}>{apt.date}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Clock size={18} color="#10b981" />
              <div style={{ fontSize: 15, fontWeight: 600, color: darkMode ? '#cbd5e1' : '#475569' }}>{apt.time}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <MapPin size={18} color="#ef4444" />
              <div style={{ fontSize: 15, fontWeight: 600, color: darkMode ? '#cbd5e1' : '#475569' }}>{doc.hospital}, {doc.location}</div>
            </div>
          </div>

            <div style={{
              marginTop: 28, padding: '16px 20px', borderRadius: 16,
              background: darkMode ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.05)',
              border: apt?.isLocal ? '1px dashed #10b981' : '1px dashed #2563eb',
              position: 'relative'
            }}>
              {apt?.isLocal && (
                <div style={{
                  position: 'absolute', top: -10, right: 10,
                  background: '#10b981', color: 'white',
                  padding: '2px 10px', borderRadius: 10,
                  fontSize: 10, fontWeight: 900, textTransform: 'uppercase'
                }}>Local Demo Mode</div>
              )}
              <div style={{ fontSize: 11, color: apt?.isLocal ? '#10b981' : '#2563eb', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Booking ID</div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '2px', color: darkMode ? '#e2e8f0' : (apt?.isLocal ? '#10b981' : '#2563eb') }}>{id.slice(-8).toUpperCase()}</div>
            </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/home')}
              style={{
                flex: 1, padding: '16px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 10px 30px rgba(37,99,235,0.3)',
              }}
            >
              <Home size={18} /> Go to Dashboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              style={{
                width: 56, height: 56, borderRadius: 16,
                background: darkMode ? 'rgba(255,255,255,0.08)' : 'white',
                border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(148,163,184,0.3)',
                color: darkMode ? '#e2e8f0' : '#475569',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Share2 size={20} />
            </motion.button>
          </div>
          <button
            onClick={() => navigate('/automation')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#2563eb', fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 10,
            }}
          >
            View n8n Automation Workflow <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
