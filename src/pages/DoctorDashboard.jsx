import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Award, Star, ChevronLeft, ChevronRight, Plus, Filter, Check, X, TrendingUp, Brain, Zap } from 'lucide-react';
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

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const { darkMode, appointments, doctors, getDoctorById, loading } = useApp();
  const [currentWeek, setCurrentWeek] = useState(new Date('2026-03-27'));
  const [selectedDay, setSelectedDay] = useState(new Date('2026-03-28'));
  const [activeInsight, setActiveInsight] = useState(null);

  // For demo, we'll act as Dr. Priya Sharma (d1)
  const doctor = getDoctorById('d1');
  const doctorAppointments = appointments.filter(a => a.doctorId === 'd1' && a.status !== 'cancelled');

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

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: textPrimary, margin: 0 }}>
              {t('doctor_dashboard.title')}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} className="pulse-slow" />
              <p style={{ color: '#10b981', fontSize: 13, fontWeight: 700, margin: 0 }}>{t('doctor_dashboard.sync')}</p>
              <div style={{ width: 1, height: 12, background: '#cbd5e1', margin: '0 4px' }} />
              <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{t('doctor_dashboard.welcome', { name: doctor?.name })}</p>
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
            { label: t('doctor_dashboard.apt_today'), val: dayAppointments.length, icon: <Calendar color="#10b981" />, trend: t('doctor_dashboard.pending_count', { count: 3 }), color: '#10b981' },
            { label: t('doctor_dashboard.consult_hours'), val: '34h', icon: <Clock color="#7c3aed" />, trend: t('doctor_dashboard.avg_per_patient'), color: '#7c3aed' },
            { label: t('doctor_dashboard.rating'), val: doctor?.rating || '4.9', icon: <Star color="#fbbf24" fill="#fbbf24" />, trend: t('doctor_dashboard.reviews_count', { count: 248 }), color: '#fbbf24' },
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

          {/* AI Recommendations */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: textPrimary, margin: 0 }}>AI Recommendations</h3>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Powered by Medi AI engine</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiInsights.slice(0, 4).map((insight, i) => (
                <motion.div key={insight.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                  onClick={() => setActiveInsight(activeInsight === insight.id ? null : insight.id)}
                  whileHover={{ x: 3 }}
                  style={{
                    padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                    background: darkMode ? 'rgba(255,255,255,0.04)' : `${insight.color}06`,
                    border: `1px solid ${insight.color}25`,
                    borderLeft: `3px solid ${insight.color}`,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{insight.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: textPrimary }}>{insight.title}</div>
                      {activeInsight === insight.id && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
                          {insight.detail}
                        </motion.div>
                      )}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                      background: `${insight.color}20`, color: insight.color }}>{insight.impact}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Left: Calendar + Appointments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Weekly Calendar Strip */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: textPrimary, margin: 0 }}>{t('doctor_dashboard.weekly_schedule')}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                {weekDays.map(day => {
                  const isSelected = isSameDay(day, selectedDay);
                  const isToday = isSameDay(day, new Date('2026-03-27'));
                  const dayCount = doctorAppointments.filter(a => isSameDay(new Date(a.date), day)).length;
                  return (
                    <motion.button key={day.toISOString()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDay(day)}
                      style={{
                        padding: '14px 6px', borderRadius: 16, border: 'none', cursor: 'pointer',
                        background: isSelected ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                        color: isSelected ? 'white' : (darkMode ? '#94a3b8' : '#64748b'),
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        boxShadow: isSelected ? '0 10px 20px rgba(37,99,235,0.3)' : 'none',
                        transition: 'all 0.3s',
                        borderTop: isToday && !isSelected ? '3px solid #10b981' : 'none',
                      }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{format(day, 'EEE')}</span>
                      <span style={{ fontSize: 18, fontWeight: 800 }}>{format(day, 'd')}</span>
                      {dayCount > 0 && (
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.3)' : '#2563eb', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          {dayCount}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Day Appointments */}
            <div style={{ ...card, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, margin: 0 }}>
                  {t('doctor_dashboard.apt_date_header', { date: format(selectedDay, 'MMM d, yyyy') })}
                </h3>
                <Filter size={18} color="#94a3b8" style={{ cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {loading ? (
                  <SkeletonLoader count={3} />
                ) : dayAppointments.length > 0 ? (
                  dayAppointments.sort((a, b) => a.time.localeCompare(b.time)).map((apt, i) => (
                    <motion.div key={apt.id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{
                        padding: '16px 20px', borderRadius: 16,
                        background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                        display: 'flex', alignItems: 'center', gap: 16,
                        borderLeft: `4px solid ${apt.status === 'confirmed' ? '#10b981' : '#f59e0b'}`,
                      }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#2563eb', minWidth: 60 }}>{apt.time}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: textPrimary }}>{apt.patientName}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                            background: apt.appointmentType === 'Check-up' ? '#10b98120' : '#7c3aed20',
                            color: apt.appointmentType === 'Check-up' ? '#10b981' : '#7c3aed', textTransform: 'uppercase' }}>
                            {apt.appointmentType || 'Consultation'}
                          </span>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{apt.age}y • {apt.gender}</div>
                        </div>
                        {apt.symptoms && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>🩺 {apt.symptoms}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => toast.success(t('doctor_dashboard.confirmed_msg'), { icon: '✅' })}
                          style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: '#10b98115', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Check size={16} />
                        </button>
                        <button onClick={() => toast(t('doctor_dashboard.rescheduled_msg'), { icon: '🔄' })}
                          style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: '#ef444415', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ color: '#94a3b8', fontSize: 14 }}>No appointments scheduled for this day</div>
                  </div>
                )}
              </div>
            </div>
          </div>

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

            <div style={card}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, marginBottom: 20 }}>{t('doctor_dashboard.today_progress')}</h3>
              {[
                { label: t('doctor_dashboard.capacity_used'), pct: 85, color: '#2563eb' },
                { label: t('doctor_dashboard.completed'), pct: 80, color: '#10b981' },
                { label: t('doctor_dashboard.satisfaction'), pct: 96, color: '#7c3aed' },
              ].map(({ label, pct, color }) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>{label}</span>
                    <span style={{ fontWeight: 700, color: textPrimary }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', borderRadius: 3 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.5 }}
                      style={{ height: '100%', background: color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
