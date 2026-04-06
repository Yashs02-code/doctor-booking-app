import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SplashScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 2;
      });
    }, 50);
    const timer = setTimeout(() => navigate('/language'), 3200);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a3e 50%, #0a1628 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', right: '20%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
      >
        {/* Icon with pulse */}
        <div style={{ position: 'relative' }}>
          <div className="pulse-ring" style={{
            position: 'absolute', inset: -12, borderRadius: '50%',
            border: '2px solid rgba(249,115,22,0.4)',
          }} />
          <div style={{
            width: 100, height: 100, borderRadius: 28,
            background: 'linear-gradient(135deg, #f97316, #ef4444, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(239,68,68,0.5)',
          }}>
            <Activity size={52} color="white" />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ fontSize: 42, fontWeight: 900, color: 'white', letterSpacing: '-1px', margin: 0 }}
          >
            Medi<span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></span>
            <span style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> AI</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginTop: 8, fontWeight: 400, letterSpacing: '0.5px' }}
          >
            {t('splash.subtitle')}
          </motion.p>
        </div>

        {/* Features row */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.9 }}
           style={{ display: 'flex', gap: 20, marginTop: 8 }}
         >
           {[
             '⚡ ' + t('splash.feature_ai'),
             '📅 ' + t('splash.feature_smart'),
             '📊 ' + t('splash.feature_insights')
           ].map(f => (
             <span key={f} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{f}</span>
           ))}
         </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          style={{ width: 240, marginTop: 20 }}
        >
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
            <motion.div
              style={{
                height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg, #f97316, #ef4444, #7c3aed)',
                width: `${progress}%`,
              }}
              animate={{ width: `${progress}%` }}
            />
          </div>
           <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 10 }}>
            {t('splash.initializing')}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
