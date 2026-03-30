import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Bell, MessageSquare, CheckCircle, Info } from 'lucide-react';

export default function NotificationBanner({ message, type = 'push', duration = 5000 }) {
  const [show, setShow] = useState(false);
  const { darkMode } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 1500);
    const hideTimer = setTimeout(() => setShow(false), duration + 1500);
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, [duration]);

  const isSMS = type === 'sms';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={{
            position: 'fixed', top: isSMS ? 100 : 30, right: 24, zIndex: 1000,
            width: 320, borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            background: isSMS ? '#fff' : (darkMode ? '#1e293b' : '#fff'),
            border: isSMS ? '1px solid #e2e8f0' : (darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0'),
          }}
        >
          {/* Header */}
          <div style={{
            padding: '10px 14px',
            background: isSMS ? '#f8fafc' : (darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'),
            display: 'flex', alignItems: 'center', gap: 8,
            borderBottom: '1px solid rgba(0,0,0,0.05)',
          }}>
            {isSMS ? (
              <div style={{ width: 20, height: 20, borderRadius: 6, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={12} color="white" />
              </div>
            ) : (
              <div style={{ width: 20, height: 20, borderRadius: 6, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={12} color="white" />
              </div>
            )}
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isSMS ? 'Messages' : 'MediAI Alert'}
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>now</span>
          </div>

          {/* Body */}
          <div style={{ padding: '14px 16px', display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: isSMS ? '#0f172a' : (darkMode ? '#e2e8f0' : '#0f172a'), marginBottom: 2 }}>
                {isSMS ? 'MediAI Booking' : 'Appointment Confirmed'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                {message}
              </div>
            </div>
            {type === 'push' && (
              <CheckCircle size={20} color="#10b981" style={{ marginTop: 2 }} />
            )}
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: 0 }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            style={{ height: 3, background: isSMS ? '#10b981' : '#2563eb' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
