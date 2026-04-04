import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calendar, Clock, MapPin, Phone, MessageSquare, XCircle, Edit2, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import PageWrapper from '../components/PageWrapper';
import SkeletonLoader from '../components/SkeletonLoader';
import SlotPicker from '../components/SlotPicker';
import toast from 'react-hot-toast';

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode, appointments, getDoctorById, cancelAppointment, rescheduleAppointment } = useApp();
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const apt = appointments.find(a => a.id === id);
  const doc = apt ? getDoctorById(apt.doctorId) : null;

  if (!apt || !doc) return <PageWrapper><div style={{ padding: 100, textAlign: 'center' }}><SkeletonLoader count={1} /></div></PageWrapper>;

  const handleCancel = () => {
    setCancelling(true);
    setTimeout(() => {
      cancelAppointment(apt.id);
      setCancelling(false);
      toast.success('Appointment cancelled successfully');
      navigate('/appointments');
    }, 1200);
  };

  const handleReschedule = () => {
    if (!selectedSlot) return;
    rescheduleAppointment(apt.id, selectedDate, selectedSlot);
    setShowReschedule(false);
    toast.success('Appointment rescheduled successfully');
  };

  const card = {
    borderRadius: 24, padding: 32,
    background: darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(30px)',
    border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.2)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
  };

  return (
    <PageWrapper>
      <div style={{ padding: '32px 24px', maxWidth: 600, margin: '0 auto' }}>
        <button onClick={() => navigate('/appointments')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
          <ChevronLeft size={18} /> Back to Appointments
        </button>

        <motion.div style={card}>
          {/* Header */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
            <div style={{ 
              width: 72, height: 72, borderRadius: 20, 
              background: `linear-gradient(135deg, ${doc.avatarColor}, ${doc.avatarColor}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 24, flexShrink: 0
            }}>
              {doc.avatar}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: darkMode ? '#e2e8f0' : '#0f172a', margin: 0 }}>{doc.name}</h1>
                <span className={`badge-${apt.status}`} style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{apt.status}</span>
              </div>
              <div style={{ fontSize: 15, color: '#64748b' }}>{doc.specialty} • {doc.hospital}</div>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Date</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#2563eb' }}>
                <Calendar size={16} /> {apt.date}
              </div>
            </div>
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Time</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#10b981' }}>
                <Clock size={16} /> {apt.time}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12 }}>Patient Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Name</span>
                <span style={{ fontWeight: 600, color: darkMode ? '#cbd5e1' : '#0f172a' }}>{apt.patientName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Age / Gender</span>
                <span style={{ fontWeight: 600, color: darkMode ? '#cbd5e1' : '#0f172a' }}>{apt.age} / {apt.gender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Symptoms</span>
                <span style={{ fontWeight: 600, color: darkMode ? '#cbd5e1' : '#0f172a', textAlign: 'right' }}>{apt.symptoms}</span>
              </div>
            </div>
          </div>

          {/* Location & Contact */}
          <div style={{ marginBottom: 32, padding: 20, borderRadius: 16, border: '1px dashed #94a3b8' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <MapPin size={18} color="#2563eb" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? '#e2e8f0' : '#0f172a' }}>{doc.hospital}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{doc.location}, India</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Phone size={18} color="#10b981" />
              <div style={{ fontSize: 14, color: darkMode ? '#cbd5e1' : '#475569' }}>+91 123 456 7890</div>
            </div>
          </div>

          {/* Actions */}
          {apt.status !== 'cancelled' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowReschedule(true)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Edit2 size={16} /> Reschedule
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                disabled={cancelling}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 700, cursor: cancelling ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {cancelling ? '...' : <><XCircle size={16} /> Cancel</>}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Reschedule Modal */}
        <AnimatePresence>
          {showReschedule && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                style={{ ...card, width: '100%', maxWidth: 460, position: 'relative' }}
              >
                <button onClick={() => setShowReschedule(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><XCircle size={24} /></button>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: darkMode ? '#e2e8f0' : '#0f172a', marginBottom: 24 }}>Reschedule Appointment</h2>
                
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Select New Date</label>
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                    {[0, 1, 2, 3, 4].map(dayOffset => {
                      const d = new Date();
                      d.setDate(d.getDate() + dayOffset);
                      const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                      return (
                        <button key={dateStr} onClick={() => setSelectedDate(dateStr)} style={{
                          padding: '10px 14px', borderRadius: 12, border: '1.5px solid',
                          borderColor: selectedDate === dateStr ? '#2563eb' : (darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
                          background: selectedDate === dateStr ? '#2563eb' : 'transparent',
                          color: selectedDate === dateStr ? 'white' : '#64748b',
                          fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap'
                        }}>
                          {dateStr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Select New Time</label>
                  <SlotPicker 
                    slots={doc.slots[selectedDate] || ['09:00', '10:00', '11:00']} 
                    selectedSlot={selectedSlot}
                    onSelect={setSelectedSlot}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleReschedule}
                  disabled={!selectedSlot}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: selectedSlot ? '#10b981' : '#94a3b8', color: 'white', fontWeight: 700, cursor: selectedSlot ? 'pointer' : 'not-allowed' }}
                >
                  Confirm Reschedule
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
