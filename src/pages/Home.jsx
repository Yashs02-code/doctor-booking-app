import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Calendar, TrendingUp, Zap, ChevronRight, Clock, Users, Star, Activity, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import PageWrapper from '../components/PageWrapper';
import DoctorCard from '../components/DoctorCard';
import { healthTips, specialties } from '../data/dummyData';

const liveStats = [
  { label: 'Appointments Booked', value: '12,480', icon: '📅', color: '#2563eb' },
  { label: 'Time Saved', value: '3,200 hrs', icon: '⏱️', color: '#10b981' },
  { label: 'Doctors Onboarded', value: '340+', icon: '👨‍⚕️', color: '#7c3aed' },
  { label: 'Patient Satisfaction', value: '4.9 / 5', icon: '⭐', color: '#f59e0b' },
];

const howItWorks = [
  {
    step: '01',
    icon: '🤖',
    title: 'Talk to the AI',
    desc: 'Describe your symptoms or reason for visit. The AI understands your intent in plain language.',
    color: '#2563eb',
  },
  {
    step: '02',
    icon: '⚡',
    title: 'AI Decides & Matches',
    desc: 'Medi AI recommends the right specialist, finds conflict-free slots, and confirms availability instantly.',
    color: '#7c3aed',
  },
  {
    step: '03',
    icon: '✅',
    title: 'Appointment Confirmed',
    desc: 'Your booking is automatically saved, confirmation sent, and all parties notified in real-time.',
    color: '#10b981',
  },
];

const problems = [
  { icon: '📞', text: 'Waiting on hold for 30+ minutes to book a slot' },
  { icon: '📋', text: 'Receptionists manually managing scheduling conflicts' },
  { icon: '❌', text: 'No-shows and last-minute cancellations with no automation' },
  { icon: '📊', text: 'Zero insight into peak hours or scheduling efficiency' },
];

const solutions = [
  { icon: '🤖', text: 'AI books in under 60 seconds, 24/7 without staff' },
  { icon: '⚡', text: 'Automated conflict resolution and smart slot suggestions' },
  { icon: '🔔', text: 'Smart reminders reduce no-shows by up to 40%' },
  { icon: '📈', text: 'Real-time analytics dashboard with AI-driven insights' },
];

export default function Home() {
  const { t } = useTranslation();
  const { currentUser, darkMode, doctors, getUpcomingAppointments, getDoctorById } = useApp();
  const navigate = useNavigate();
  const [tipIdx, setTipIdx] = useState(0);
  const [statIdx, setStatIdx] = useState(0);
  const upcoming = getUpcomingAppointments().slice(0, 2);
  const featuredDoctors = doctors.filter(d => d.available).slice(0, 4);

  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % healthTips.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setStatIdx(i => (i + 1) % liveStats.length), 2000);
    return () => clearInterval(t);
  }, []);

  const quickActions = [
    { icon: <MessageSquare size={22} color="white" />, label: 'AI Assistant', sub: 'Book via conversation', color: '#2563eb', gradient: 'linear-gradient(135deg,#2563eb,#4f46e5)', path: '/chat' },
    { icon: <Calendar size={22} color="white" />, label: 'Appointments', sub: 'View & manage', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)', path: '/appointments' },
    { icon: <Activity size={22} color="white" />, label: 'Dashboard', sub: 'Doctor portal', color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)', path: '/doctor-dashboard' },
    { icon: <TrendingUp size={22} color="white" />, label: 'Insights', sub: 'AI analytics', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', path: '/insights' },
  ];

  const bg = darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)';
  const border = darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.2)';
  const textPrimary = darkMode ? '#e2e8f0' : '#0f172a';

  const card = { borderRadius: 20, padding: 24, background: bg, backdropFilter: 'blur(20px)', border };

  return (
    <PageWrapper>
      <div style={{ minHeight: 'calc(100vh - 64px)', maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px' }}
        className={darkMode ? 'mesh-bg-dark' : 'mesh-bg'}
      >

        {/* ─── HERO SECTION ─── */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', padding: '60px 0 40px' }}>
          {/* <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 30,
            background: darkMode ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.3)', marginBottom: 24 }}>
            <Zap size={14} color="#f97316" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2330ddff' }}>NATIONAL INNOVATION AWARD — AI HEALTH TECH 2026</span>
          </div> */}

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, color: textPrimary, lineHeight: 1.1, marginBottom: 20 }}>
            {t('home.hero_title_ai')}<br />
            <span style={{ background: 'linear-gradient(135deg, #f97316, #ef4444, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('home.hero_title_system')}
            </span>
          </h1>

          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
            {t('home.hero_desc')}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <motion.button whileHover={{ y: -3, boxShadow: '0 20px 50px rgba(249,115,22,0.4)' }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/chat')}
              style={{ padding: '14px 32px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15,
                boxShadow: '0 8px 30px rgba(30, 28, 178, 0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🤖 {t('home.hero_try_ai')} <ChevronRight size={18} />
            </motion.button>
            <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/insights')}
              style={{ padding: '14px 32px', borderRadius: 16, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                background: 'transparent', color: textPrimary,
                border: darkMode ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid rgba(15,23,42,0.2)',
                display: 'flex', alignItems: 'center', gap: 8 }}>
              📊 {t('home.hero_view_insights')}
            </motion.button>
          </div>
        </motion.div>

        {/* ─── LIVE STATS ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 48 }}>
          {[
            { label: t('home.stats.booked'), value: '12,480', icon: '📅', color: '#2563eb' },
            { label: t('home.stats.saved'), value: '3,200 hrs', icon: '⏱️', color: '#10b981' },
            { label: t('home.stats.onboarded'), value: '340+', icon: '👨‍⚕️', color: '#7c3aed' },
            { label: t('home.stats.satisfaction'), value: '4.9 / 5', icon: '⭐', color: '#f59e0b' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.07 }}
              style={{ ...card, textAlign: 'center', padding: '20px', boxShadow: `0 8px 24px ${s.color}15` }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1.1, marginTop: 8 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── HEALTH TIP TICKER ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ ...card, marginBottom: 48, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
          <span style={{ fontSize: 22 }}>💡</span>
          <motion.p key={tipIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            style={{ fontSize: 14, color: darkMode ? '#cbd5e1' : '#475569', margin: 0, flex: 1 }}>
            {healthTips[tipIdx]}
          </motion.p>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{t('home.health_tip_label')}</span>
        </motion.div>

        {/* ─── QUICK ACTIONS ─── */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 16 }}>{t('home.quick_actions')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 48 }}>
          {[
            { icon: <MessageSquare size={22} color="white" />, label: t('home.actions.ai_assistant'), sub: t('home.actions.ai_assistant_sub'), color: '#2563eb', gradient: 'linear-gradient(135deg,#2563eb,#4f46e5)', path: '/chat' },
            { icon: <Calendar size={22} color="white" />, label: t('home.actions.appointments'), sub: t('home.actions.appointments_sub'), color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)', path: '/appointments' },
            { icon: <Activity size={22} color="white" />, label: t('home.actions.dashboard'), sub: t('home.actions.dashboard_sub'), color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)', path: '/doctor-dashboard' },
            { icon: <TrendingUp size={22} color="white" />, label: t('home.actions.insights'), sub: t('home.actions.insights_sub'), color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', path: '/insights' },
          ].map((a, i) => (
            <motion.button key={a.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -6, boxShadow: `0 20px 50px ${a.color}30` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.path)}
              style={{ ...card, cursor: 'pointer', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, padding: 24, textAlign: 'left' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: a.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {a.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: textPrimary }}>{a.label}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{a.sub}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* ─── HOW IT WORKS ───
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 8 }}>How Medi AI Works</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Three intelligent steps from intent to confirmed appointment</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {howItWorks.map((step, i) => (
              <motion.div key={step.step}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.12 }}
                whileHover={{ y: -4 }}
                style={{ ...card, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 80, opacity: 0.04, fontWeight: 900 }}>{step.step}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 32 }}>{step.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: step.color, background: `${step.color}15`, padding: '3px 10px', borderRadius: 8 }}>STEP {step.step}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div> */}


        {/* ─── SPECIALTIES ─── */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 16 }}>{t('home.browse_specialty')}</h2>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 48 }}>
          {specialties.map((s, i) => (
            <motion.button key={s.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
              whileHover={{ y: -4, boxShadow: `0 12px 30px ${s.color}20` }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/chat')}
              style={{ flexShrink: 0, padding: '14px 18px', borderRadius: 18, border: 'none', cursor: 'pointer',
                background: darkMode ? `${s.color}20` : `${s.color}12`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 90 }}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color, whiteSpace: 'nowrap' }}>{s.name}</span>
            </motion.button>
          ))}
        </div>

 {/* ─── UPCOMING APPOINTMENTS ─── */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, margin: 0 }}>{t('home.upcoming_appointments')}</h2>
              <button onClick={() => navigate('/appointments')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                {t('home.view_all')} <ChevronRight size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcoming.map(apt => {
                const doc = getDoctorById(apt.doctorId);
                return (
                  <motion.div key={apt.id} whileHover={{ x: 4 }}
                    onClick={() => navigate(`/appointment/${apt.id}`)}
                    style={{ ...card, display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${doc?.avatarColor}, ${doc?.avatarColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                      {doc?.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: textPrimary }}>{doc?.name}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{doc?.specialty}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{apt.time}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{apt.date}</div>
                    </div>
                    <CheckCircle size={18} color="#10b981" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── PROBLEM vs SOLUTION ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 24 }}>{t('home.problem_solution')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Problem */}
            <div style={{ ...card, borderLeft: '3px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>❌</span>
                <h3 style={{ fontWeight: 800, color: '#ef4444', margin: 0, fontSize: 16 }}>{t('home.traditional')}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {t('home.problems', { returnObjects: true }).map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>❌</span>
                    <span style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Solution */}
            <div style={{ ...card, borderLeft: '3px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <h3 style={{ fontWeight: 800, color: '#10b981', margin: 0, fontSize: 16 }}>{t('home.medi_ai')}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {t('home.solutions', { returnObjects: true }).map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
                    <span style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        

       

        {/* ─── FEATURED DOCTORS ─── */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 16 }}>{t('home.featured_doctors')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {featuredDoctors.map(doc => (
              <DoctorCard key={doc.id} doctor={doc} onBook={() => navigate('/chat')} />
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
