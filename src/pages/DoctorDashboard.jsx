import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Award, Star, ChevronLeft, ChevronRight, Plus, Filter, Check, X, TrendingUp, Brain, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import PageWrapper from '../components/PageWrapper';
import SkeletonLoader from '../components/SkeletonLoader';
import { dailyAppointmentData, aiInsights } from '../data/dummyData';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label, darkMode }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: darkMode ? '#1e293b' : 'white',
      border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(148,163,184,0.2)',
      borderRadius: 12, padding: '10px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

const DebugBanner = ({ user, totalCount, syncStatus, lastSync, onRefresh, darkMode }) => (
  <div style={{
    background: darkMode ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.05)',
    border: `1px dashed ${syncStatus === 'error' ? '#ef4444' : '#2563eb'}`,
    borderRadius: 16, padding: '12px 20px', marginBottom: 24,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  }}>
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ fontSize: 13 }}><span style={{ color: '#64748b' }}>UID:</span> <code style={{ color: '#6366f1' }}>{user?.id?.substring(0,8)}...</code></div>
      <div style={{ fontSize: 13 }}><span style={{ color: '#64748b' }}>Role:</span> <strong style={{ color: '#10b981' }}>{user?.role}</strong></div>
      <div style={{ fontSize: 13 }}><span style={{ color: '#64748b' }}>Doctor ID:</span> <strong style={{ color: '#7c3aed' }}>{user?.doctorId || 'None'}</strong></div>
      <div style={{ fontSize: 13 }}><span style={{ color: '#64748b' }}>Appts:</span> <strong style={{ color: '#f59e0b' }}>{totalCount}</strong></div>
      <div style={{ fontSize: 13 }}><span style={{ color: '#64748b' }}>Sync:</span> <strong style={{ color: syncStatus === 'synced' ? '#10b981' : '#ef4444' }}>{syncStatus}</strong></div>
      {lastSync && <div style={{ fontSize: 13 }}><span style={{ color: '#64748b' }}>Last:</span> <strong>{lastSync}</strong></div>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onRefresh}
        style={{ padding: '6px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        <RefreshCw size={12} /> Force Sync
      </motion.button>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>🔧 Diagnostics</div>
    </div>
  </div>
);

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const { darkMode, appointments, currentUser, getDoctorById, updateAppointmentStatus, loading, syncStatus, lastSync, refreshSync } = useApp();
  const [currentWeek, setCurrentWeek] = useState(new Date('2026-03-27'));
  const [selectedDay, setSelectedDay] = useState(new Date('2026-03-28'));
  const [activeInsight, setActiveInsight] = useState(null);

  // NEW METHOD: Link appointments by email for bulletproof sync
  const doctorEmail = currentUser?.email?.toLowerCase() || '';
  const doctorProfile = getDoctorById(currentUser?.doctorId || 'd1');
  const totalCount = appointments.length;
  
  const doctorAppointments = appointments.filter(a => 
    (a.doctorEmail === doctorEmail || a.doctorId === currentUser?.doctorId) && 
    a.status !== 'cancelled'
  );
  
  const pendingRequests = doctorAppointments.filter(a => a.status === 'pending');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const dayAppointments = doctorAppointments.filter(a => isSameDay(new Date(a.date), selectedDay));

  const textPrimary = darkMode ? '#e2e8f0' : '#0f172a';
  const chartGrid = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const chartAxis = darkMode ? '#475569' : '#94a3b8';

  const card = {
    borderRadius: 24, padding: 24,
    background: darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(30px)',
    border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.2)',
  };

  return (
    <PageWrapper>
      <div style={{ padding: '32px 24px', maxWidth: 1300, margin: '0 auto' }}>
        
        {/* Debug Banner - CRITICAL FOR SYNC VERIFICATION */}
        <DebugBanner 
          user={currentUser} 
          totalCount={totalCount} 
          syncStatus={syncStatus} 
          lastSync={lastSync}
          onRefresh={refreshSync}
          darkMode={darkMode} 
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: textPrimary, margin: 0 }}>
              {t('doctor_dashboard.title')}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: syncStatus === 'synced' ? '#10b981' : (syncStatus === 'error' ? '#ef4444' : '#f59e0b'), 
                boxShadow: `0 0 8px ${syncStatus === 'synced' ? '#10b981' : '#f59e0b'}` 
              }} className={syncStatus === 'connecting' ? 'pulse-fast' : 'pulse-slow'} />
              <p style={{ color: syncStatus === 'synced' ? '#10b981' : '#f59e0b', fontSize: 13, fontWeight: 700, margin: 0 }}>
                {syncStatus === 'synced' ? t('doctor_dashboard.sync') : (syncStatus === 'connecting' ? 'Connecting...' : 'Sync Error')}
              </p>
              <div style={{ width: 1, height: 12, background: '#cbd5e1', margin: '0 4px' }} />
              <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{t('doctor_dashboard.welcome', { name: doctorProfile?.name })}</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{ padding: '12px 20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 20px rgba(37,99,235,0.2)' }}>
            <Plus size={18} /> {t('doctor_dashboard.add_entry')}
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
           {[
            { label: t('doctor_dashboard.total_patients'), val: '1,284', icon: <Users color="#2563eb" />, trend: `+12% ${t('doctor_dashboard.this_month')}`, color: '#2563eb' },
            { label: t('doctor_dashboard.apt_today'), val: dayAppointments.length, icon: <Calendar color="#10b981" />, trend: t('doctor_dashboard.pending_count', { count: pendingRequests.length }), color: '#10b981' },
            { label: t('doctor_dashboard.consult_hours'), val: '34h', icon: <Clock color="#7c3aed" />, trend: t('doctor_dashboard.avg_per_patient'), color: '#7c3aed' },
            { label: t('doctor_dashboard.rating'), val: doctorProfile?.rating || '4.9', icon: <Star color="#fbbf24" fill="#fbbf24" />, trend: t('doctor_dashboard.reviews_count', { count: 248 }), color: '#fbbf24' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ ...card, boxShadow: `0 8px 24px ${s.color}15` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: darkMode ? 'rgba(255,255,255,0.05)' : `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{s.trend}</div>
              </div>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: textPrimary }}>{s.val}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 28 }}>

          {/* Weekly Appointments Bar Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <TrendingUp size={20} color="#2563eb" />
              <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, margin: 0 }}>{t('doctor_dashboard.apt_per_day')}</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyAppointmentData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis dataKey="day" tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                <Bar dataKey="confirmed" name={t('doctor_dashboard.confirmed')} fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending"   name={t('doctor_dashboard.pending')}   fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name={t('doctor_dashboard.cancelled')} fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

        {/* Right: Availability + Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={card}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, marginBottom: 20 }}>{t('doctor_dashboard.availability')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: darkMode ? '#cbd5e1' : '#475569', fontWeight: 500 }}>{day}</span>
                    <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>09:00 – 17:00</span>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: 20, padding: 12, borderRadius: 14, border: '1px solid rgba(37,99,235,0.3)', background: 'none', color: '#2563eb', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                {t('doctor_dashboard.manage_slots')}
              </button>
            </div>

          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
          {/* Left: Appointment Requests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={20} color="#2563eb" />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: textPrimary, margin: 0 }}>{t('doctor_dashboard.pending_requests') || 'Appointment Requests'}</h3>
                </div>
                <div style={{ padding: '4px 12px', borderRadius: 20, background: '#f59e0b20', color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>
                   {pendingRequests.length} {t('doctor_dashboard.pending') || 'Pending'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((apt, i) => (
                    <motion.div key={apt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      style={{ 
                        padding: 20, borderRadius: 20, 
                        background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                         <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
                           {apt.patientName?.charAt(0) || 'P'}
                         </div>
                         <div>
                           <div style={{ fontWeight: 700, fontSize: 16, color: textPrimary }}>{apt.patientName}</div>
                           <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                             <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} /> {apt.date} • <Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> {apt.time}
                           </div>
                           <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{apt.appointmentType} • {apt.symptoms}</div>
                         </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => updateAppointmentStatus(apt.id, 'rejected')}
                          style={{ padding: '8px 16px', borderRadius: 12, border: '1.5px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          <X size={16} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                          style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                          <Check size={16} /> {t('doctor_dashboard.accept') || 'Accept'}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
                    <p style={{ margin: 0, fontWeight: 500 }}>{t('doctor_dashboard.no_pending') || 'No pending requests at the moment'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right: Activity Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={card}>
               <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, marginBottom: 20 }}>{t('doctor_dashboard.recent_activity') || 'Recent Activity'}</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 {doctorAppointments.filter(a => a.status !== 'pending').slice(0, 5).map((apt, i) => (
                   <div key={apt.id} style={{ display: 'flex', gap: 12 }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: apt.status === 'confirmed' ? '#10b981' : '#ef4444', marginTop: 6, flexShrink: 0 }} />
                     <div>
                       <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{apt.patientName}</div>
                       <div style={{ fontSize: 11, color: '#64748b' }}>
                         {apt.status === 'confirmed' ? 'Accepted' : 'Rejected'} • {apt.date}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
