import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calendar, Clock, MapPin, Phone, MessageSquare, XCircle, Edit2, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import PageWrapper from '../components/PageWrapper';
import SkeletonLoader from '../components/SkeletonLoader';
import SlotPicker from '../components/SlotPicker';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export default function AppointmentDetail() {
  const { t } = useTranslation();
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
      toast.success(t('appointment_detail.cancel_success'));
      navigate('/appointments');
    }, 1200);
  };

  const handleReschedule = () => {
    if (!selectedSlot) return;
    rescheduleAppointment(apt.id, selectedDate, selectedSlot);
    setShowReschedule(false);
    toast.success(t('appointment_detail.reschedule_success'));
  };

  const downloadPrescription = async () => {
    const loadingToast = toast.loading(t('confirmation.confirming'));
    try {
      const docPdf = new jsPDF();
      const qrData = window.location.href;
      const qrDataUrl = await QRCode.toDataURL(qrData);

      // --- PDF STYLING ---
      const primaryColor = [37, 99, 235]; // #2563eb
      
      docPdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      docPdf.rect(0, 0, 210, 40, 'F');
      
      docPdf.setFillColor(255, 255, 255);
      docPdf.circle(25, 20, 10, 'F');
      docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      docPdf.setFontSize(14);
      docPdf.setFont("helvetica", "bold");
      docPdf.text("M", 22, 22);

      docPdf.setTextColor(255, 255, 255);
      docPdf.setFontSize(22);
      docPdf.text("Medi AI Clinic", 40, 22);
      docPdf.setFontSize(10);
      docPdf.setFont("helvetica", "normal");
      docPdf.text("Autonomous Healthcare Orchestration", 40, 30);
      docPdf.text("Phone: +91 8928024884", 150, 30);

      docPdf.setTextColor(0, 0, 0);
      docPdf.setFontSize(18);
      docPdf.setFont("helvetica", "bold");
      docPdf.text(t('confirmation.digital_prescription').toUpperCase(), 105, 55, { align: 'center' });
      
      docPdf.setDrawColor(200, 200, 200);
      docPdf.line(20, 60, 190, 60);

      docPdf.setFontSize(11);
      docPdf.setTextColor(100, 100, 100);
      docPdf.text(t('confirmation.patient_name'), 20, 75);
      docPdf.setTextColor(0, 0, 0);
      docPdf.setFontSize(13);
      docPdf.text(apt.patientName, 20, 82);

      docPdf.setFontSize(11);
      docPdf.setTextColor(100, 100, 100);
      docPdf.text(t('confirmation.booking_id'), 130, 75);
      docPdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      docPdf.setFontSize(13);
      docPdf.text(apt.id.slice(-8).toUpperCase(), 130, 82);

      docPdf.setFontSize(11);
      docPdf.setTextColor(100, 100, 100);
      docPdf.text(t('confirmation.doctor_name'), 20, 100);
      docPdf.setTextColor(0, 0, 0);
      docPdf.setFontSize(13);
      docPdf.text(doc.name, 20, 107);

      docPdf.setFontSize(11);
      docPdf.setTextColor(100, 100, 100);
      docPdf.text(t('confirmation.specialty'), 130, 100);
      docPdf.setTextColor(0, 0, 0);
      docPdf.setFontSize(13);
      docPdf.text(doc.specialty, 130, 107);

      docPdf.setFontSize(11);
      docPdf.setTextColor(100, 100, 100);
      docPdf.text(t('confirmation.date'), 20, 125);
      docPdf.setTextColor(0, 0, 0);
      docPdf.setFontSize(13);
      docPdf.text(apt.date, 20, 132);

      docPdf.setFontSize(11);
      docPdf.setTextColor(100, 100, 100);
      docPdf.text(t('confirmation.time'), 130, 125);
      docPdf.setTextColor(0, 0, 0);
      docPdf.setFontSize(13);
      docPdf.text(apt.time, 130, 132);

      docPdf.setFontSize(11);
      docPdf.setTextColor(100, 100, 100);
      docPdf.text("Venue", 20, 150);
      docPdf.setTextColor(0, 0, 0);
      docPdf.setFontSize(12);
      docPdf.text(`${doc.hospital}, ${doc.location}`, 20, 157);

      docPdf.setDrawColor(200, 200, 200);
      docPdf.line(20, 170, 190, 170);

      docPdf.setFontSize(10);
      docPdf.setTextColor(150, 150, 150);
      docPdf.text(t('confirmation.prescription_desc'), 20, 180);

      docPdf.setTextColor(0, 0, 0);
      docPdf.setFontSize(10);
      docPdf.text(t('confirmation.verified'), 160, 195, { align: 'center' });
      docPdf.addImage(qrDataUrl, 'PNG', 150, 200, 20, 20);

      docPdf.setFontSize(9);
      docPdf.setTextColor(150, 150, 150);
      const footerText = "This is a computer-generated document and does not require a physical signature.";
      docPdf.text(footerText, 105, 280, { align: 'center' });

      docPdf.save(`Prescription_${apt.id.slice(-8).toUpperCase()}.pdf`);
      toast.success(t('confirmation.booking_success_toast'), { id: loadingToast });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF", { id: loadingToast });
    }
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
          <ChevronLeft size={18} /> {t('appointment_detail.back')}
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
                <span className={`badge-${apt.status}`} style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  background: darkMode ? (apt.status === 'confirmed' ? '#065f46' : apt.status === 'pending' ? '#78350f' : (apt.status === 'rejected' || apt.status === 'cancelled') ? '#7f1d1d' : '#334155') : (apt.status === 'confirmed' ? '#d1fae5' : apt.status === 'pending' ? '#fef3c7' : (apt.status === 'rejected' || apt.status === 'cancelled') ? '#fee2e2' : '#f1f5f9'),
                  color: darkMode ? (apt.status === 'confirmed' ? '#a7f3d0' : apt.status === 'pending' ? '#fde68a' : (apt.status === 'rejected' || apt.status === 'cancelled') ? '#fca5a5' : '#94a3b8') : (apt.status === 'confirmed' ? '#065f46' : apt.status === 'pending' ? '#92400e' : (apt.status === 'rejected' || apt.status === 'cancelled') ? '#991b1b' : '#64748b')
                }}>
                  {apt.status === 'confirmed' ? t('appointments_list.confirmed') : apt.status === 'pending' ? t('appointments_list.pending') : apt.status === 'rejected' ? (t('appointments_list.rejected') || 'Rejected') : t('appointments_list.cancelled')}
                </span>
              </div>
              <div style={{ fontSize: 15, color: '#64748b' }}>{doc.specialty} • {doc.hospital}</div>
            </div>
          </div>

          {/* Status Banner */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ 
              marginBottom: 32, padding: '16px 20px', borderRadius: 16, 
              display: 'flex', alignItems: 'center', gap: 14,
              background: apt.status === 'confirmed' ? (darkMode ? 'rgba(16,185,129,0.1)' : '#f0fdf4') :
                         apt.status === 'rejected' ? (darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2') :
                         (darkMode ? 'rgba(245,158,11,0.1)' : '#fffbeb'),
              border: `1px solid ${apt.status === 'confirmed' ? '#10b98144' : apt.status === 'rejected' ? '#ef444444' : '#f59e0b44'}`,
            }}>
            {apt.status === 'confirmed' ? <CheckCircle size={20} color="#10b981" /> : 
             apt.status === 'rejected' ? <XCircle size={20} color="#ef4444" /> : 
             <AlertCircle size={20} color="#f59e0b" />}
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: apt.status === 'confirmed' ? '#10b981' : apt.status === 'rejected' ? '#ef4444' : '#d97706' }}>
                {apt.status === 'confirmed' ? (t('appointment_detail.status_accepted_title') || 'Confirmed!') : 
                 apt.status === 'rejected' ? (t('appointment_detail.status_rejected_title') || 'Declined') : 
                 (t('appointment_detail.status_pending_title') || 'Pending Approval')}
              </div>
              <div style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#64748b', marginTop: 2 }}>
                {apt.status === 'confirmed' ? (t('appointment_detail.status_accepted_msg') || 'Your appointment has been accepted by the doctor!') : 
                 apt.status === 'rejected' ? (t('appointment_detail.status_rejected_msg') || 'Your appointment has been rejected by the doctor. Please choose another slot.') : 
                 (t('appointment_detail.status_pending_msg') || 'The doctor is reviewing your request. You\'ll be notified once confirmed.')}
              </div>
            </div>
          </motion.div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>{t('appointment_detail.date')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#2563eb' }}>
                <Calendar size={16} /> {apt.date}
              </div>
            </div>
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>{t('appointment_detail.time')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#10b981' }}>
                <Clock size={16} /> {apt.time}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12 }}>{t('appointment_detail.patient_info')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>{t('appointment_detail.name')}</span>
                <span style={{ fontWeight: 600, color: darkMode ? '#cbd5e1' : '#0f172a' }}>{apt.patientName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>{t('appointment_detail.age_gender')}</span>
                <span style={{ fontWeight: 600, color: darkMode ? '#cbd5e1' : '#0f172a' }}>{apt.age} / {apt.gender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>{t('appointment_detail.symptoms')}</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowReschedule(true)}
                  style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Edit2 size={16} /> {t('appointment_detail.reschedule')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{ flex: 1, padding: '14px', borderRadius: 14, border: '1.5px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 700, cursor: cancelling ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {cancelling ? '...' : <><XCircle size={16} /> {t('appointment_detail.cancel')}</>}
                </motion.button>
              </div>

              {apt.status === 'confirmed' && (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={downloadPrescription}
                  style={{
                    padding: '16px', borderRadius: 16, border: darkMode ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,185,129,0.2)',
                    background: darkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
                    color: '#10b981', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Download size={18} /> {t('confirmation.download_prescription')}
                </motion.button>
              )}
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
                 <h2 style={{ fontSize: 20, fontWeight: 800, color: darkMode ? '#e2e8f0' : '#0f172a', marginBottom: 24 }}>{t('appointment_detail.reschedule_title')}</h2>
                 
                 <div style={{ marginBottom: 20 }}>
                   <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{t('appointment_detail.select_date')}</label>
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
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>{t('appointment_detail.select_time')}</label>
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
                   {t('appointment_detail.confirm_reschedule')}
                 </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
