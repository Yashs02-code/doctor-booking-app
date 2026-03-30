import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DoctorCard({ doctor, compact = false, onBook }) {
  const { darkMode } = useApp();

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(37,99,235,0.18)' }}
      transition={{ duration: 0.3 }}
      style={{
        borderRadius: 20,
        padding: compact ? 16 : 24,
        background: darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.2)',
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        gap: 16,
        cursor: 'default',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: compact ? 'center' : 'flex-start', gap: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: compact ? 50 : 64, height: compact ? 50 : 64,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${doctor.avatarColor}, ${doctor.avatarColor}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: compact ? 16 : 20,
            boxShadow: `0 4px 20px ${doctor.avatarColor}40`,
          }}>
            {doctor.avatar}
          </div>
          {doctor.available && (
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 12, height: 12, borderRadius: '50%',
              background: '#10b981', border: '2px solid white',
            }} />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 700, fontSize: compact ? 15 : 17, color: darkMode ? '#e2e8f0' : '#0f172a', margin: 0 }}>{doctor.name}</h3>
          <span style={{
            display: 'inline-block', marginTop: 4,
            background: `${doctor.avatarColor}15`,
            color: doctor.avatarColor,
            border: `1px solid ${doctor.avatarColor}30`,
            borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
          }}>
            {doctor.specialty}
          </span>
        </div>
      </div>

      {!compact && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fbbf24', fontSize: 13 }}>
              <Star size={14} fill="#fbbf24" />
              <span style={{ fontWeight: 700, color: darkMode ? '#e2e8f0' : '#0f172a' }}>{doctor.rating}</span>
              <span style={{ color: '#94a3b8' }}>({doctor.reviewCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748b' }}>
              <Award size={14} color="#2563eb" />
              {doctor.experience}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748b' }}>
              <MapPin size={14} color="#10b981" />
              {doctor.location}
            </div>
          </div>

          <div style={{
            padding: '10px 14px', borderRadius: 12,
            background: darkMode ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Consultation Fee</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#2563eb' }}>₹{doctor.fee}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Hospital</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: darkMode ? '#cbd5e1' : '#475569' }}>{doctor.hospital}</div>
            </div>
          </div>

          {onBook && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => onBook(doctor)}
              style={{
                width: '100%', padding: '12px', borderRadius: 14, border: 'none',
                background: doctor.available ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#94a3b8',
                color: 'white', fontWeight: 700, fontSize: 14, cursor: doctor.available ? 'pointer' : 'not-allowed',
                boxShadow: doctor.available ? '0 4px 20px rgba(37,99,235,0.4)' : 'none',
              }}
            >
              {doctor.available ? '📅 Book Appointment' : 'Not Available Today'}
            </motion.button>
          )}
        </>
      )}
    </motion.div>
  );
}
