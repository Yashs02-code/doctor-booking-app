import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { languages } from '../data/languages';
import { Globe, ChevronRight } from 'lucide-react';

export default function LanguageSelect() {
  const { setLanguage, darkMode } = useApp();
  const navigate = useNavigate();

  const handleSelect = (lang) => {
    setLanguage(lang.id);
    navigate('/auth');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh', padding: '40px 24px',
        background: darkMode
          ? 'linear-gradient(135deg, #0a0f1e 0%, #0d1a3e 100%)'
          : 'linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #2563eb, #10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 30px rgba(37,99,235,0.4)',
        }}>
          <Globe size={28} color="white" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: darkMode ? '#e2e8f0' : '#0f172a', margin: 0 }}>
          Choose Language
        </h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Select your preferred language to continue
        </p>
      </motion.div>

      {/* Language Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 14, width: '100%', maxWidth: 820,
      }}>
        {languages.map((lang, i) => (
          <motion.button
            key={lang.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            whileHover={{ y: -4, boxShadow: darkMode ? '0 16px 40px rgba(37,99,235,0.3)' : '0 16px 40px rgba(37,99,235,0.15)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(lang)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '18px 20px', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.2)',
              textAlign: 'left', transition: 'all 0.3s ease',
              boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <span style={{ fontSize: 36, flexShrink: 0 }}>{lang.flag}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: darkMode ? '#e2e8f0' : '#0f172a' }}>{lang.name}</div>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{lang.native}</div>
            </div>
            <ChevronRight size={18} color="#64748b" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
