import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Search, LayoutList, CalendarDays, XCircle, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import PageWrapper from '../components/PageWrapper';
import SkeletonLoader from '../components/SkeletonLoader';

const STATUS_FILTERS = ['All', 'Confirmed', 'Pending', 'Cancelled'];

function CalendarView({ appointments, getDoctorById, darkMode, navigate }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;
  const cells = [...Array(startPadding).fill(null), ...days];

  const textPrimary = darkMode ? '#e2e8f0' : '#0f172a';
  const cardBg = darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)';
  const cellBg = darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Month Navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: 18 }}>‹</button>
        <span style={{ fontWeight: 800, fontSize: 18, color: textPrimary }}>{format(calMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: 18 }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const dayApts = appointments.filter(a => {
            try { return isSameDay(new Date(a.date), day); } catch { return false; }
          });
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} style={{
              minHeight: 72, borderRadius: 10, padding: '6px 8px',
              background: isToday ? 'linear-gradient(135deg, #2563eb15, #7c3aed15)' : cellBg,
              border: isToday ? '1.5px solid #2563eb66' : `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(148,163,184,0.15)'}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? '#2563eb' : '#94a3b8', marginBottom: 4 }}>
                {format(day, 'd')}
              </div>
              {dayApts.slice(0, 2).map(apt => {
                const doc = getDoctorById(apt.doctorId);
                const dotColor = apt.status === 'confirmed' ? '#10b981' : apt.status === 'pending' ? '#f59e0b' : '#ef4444';
                return (
                  <div key={apt.id} onClick={() => navigate(`/appointment/${apt.id}`)}
                    style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, marginBottom: 2, cursor: 'pointer',
                      background: `${dotColor}20`, color: dotColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {apt.time} {doc?.name?.split(' ')[0]}
                  </div>
                );
              })}
              {dayApts.length > 2 && (
                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>+{dayApts.length - 2} more</div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function AppointmentList() {
  const { darkMode, getUpcomingAppointments, getPastAppointments, appointments, getDoctorById, loading } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  const upcoming = getUpcomingAppointments();
  const past = getPastAppointments();

  const filtered = useMemo(() => {
    let list = tab === 'upcoming' ? upcoming : past;
    if (statusFilter !== 'All') list = list.filter(a => a.status === statusFilter.toLowerCase());
    if (dateFrom) list = list.filter(a => a.date >= dateFrom);
    if (dateTo) list = list.filter(a => a.date <= dateTo);
    if (search) list = list.filter(a => {
      const doc = getDoctorById(a.doctorId);
      return doc?.name.toLowerCase().includes(search.toLowerCase()) ||
             doc?.specialty.toLowerCase().includes(search.toLowerCase()) ||
             a.patientName?.toLowerCase().includes(search.toLowerCase());
    });
    return list;
  }, [tab, upcoming, past, statusFilter, dateFrom, dateTo, search]);

  const textPrimary = darkMode ? '#e2e8f0' : '#0f172a';
  const card = {
    borderRadius: 20, padding: 20,
    background: darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.2)',
    display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease',
  };

  const getStatusBadge = (status) => {
    const map = {
      confirmed: { bg: '#d1fae5', color: '#065f46', darkBg: '#065f46', darkColor: '#a7f3d0' },
      pending:   { bg: '#fef3c7', color: '#92400e', darkBg: '#78350f', darkColor: '#fde68a' },
      cancelled: { bg: '#fee2e2', color: '#991b1b', darkBg: '#7f1d1d', darkColor: '#fca5a5' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
        background: darkMode ? s.darkBg : s.bg, color: darkMode ? s.darkColor : s.color }}>
        {status}
      </span>
    );
  };

  const clearFilters = () => { setSearch(''); setStatusFilter('All'); setDateFrom(''); setDateTo(''); };
  const hasFilters = search || statusFilter !== 'All' || dateFrom || dateTo;

  return (
    <PageWrapper>
      <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: textPrimary, margin: 0 }}>Appointments</h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: 15 }}>Manage your bookings and medical history</p>
        </div>

        {/* Tabs + View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 14, padding: 4 }}>
            {[['upcoming', '📅 Upcoming'], ['past', '🕒 History']].map(([val, label]) => (
              <motion.button key={val} onClick={() => setTab(val)}
                style={{
                  padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: tab === val ? (darkMode ? '#2563eb' : 'white') : 'transparent',
                  color: tab === val ? (darkMode ? 'white' : '#2563eb') : '#64748b',
                  fontWeight: 700, fontSize: 13, transition: 'all 0.3s',
                  boxShadow: tab === val ? (darkMode ? '0 4px 12px rgba(37,99,235,0.3)' : '0 2px 8px rgba(0,0,0,0.05)') : 'none',
                }}>
                {label}
              </motion.button>
            ))}
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[['list', <LayoutList size={16} />], ['calendar', <CalendarDays size={16} />]].map(([mode, icon]) => (
              <motion.button key={mode} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={() => setViewMode(mode)}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: viewMode === mode ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : (darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                  color: viewMode === mode ? 'white' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                {icon}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        <div style={{
          borderRadius: 18, padding: 18, marginBottom: 20,
          background: darkMode ? 'rgba(20,30,60,0.5)' : 'rgba(255,255,255,0.7)',
          border: darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(148,163,184,0.2)',
          backdropFilter: 'blur(16px)',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input className="input-field" style={{ paddingLeft: 42 }}
              placeholder="Search by doctor, specialty or patient name…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Status filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', alignSelf: 'center' }}>
              <Filter size={12} style={{ display: 'inline', marginRight: 4 }} />Status:
            </span>
            {STATUS_FILTERS.map(s => (
              <motion.button key={s} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: statusFilter === s ? '#2563eb' : (darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                  color: statusFilter === s ? 'white' : '#64748b',
                }}>
                {s}
              </motion.button>
            ))}
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>📅 Date range:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="input-field"
              style={{ width: 160, padding: '8px 12px', fontSize: 13 }} />
            <span style={{ color: '#94a3b8', fontSize: 13 }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="input-field"
              style={{ width: 160, padding: '8px 12px', fontSize: 13 }} />
            {hasFilters && (
              <motion.button whileHover={{ scale: 1.05 }} onClick={clearFilters}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12, fontWeight: 700 }}>
                <XCircle size={14} /> Clear
              </motion.button>
            )}
          </div>
        </div>

        {/* Results summary */}
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, fontWeight: 500 }}>
          Showing <span style={{ fontWeight: 800, color: textPrimary }}>{filtered.length}</span> appointment{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonLoader count={4} />
        ) : viewMode === 'calendar' ? (
          <div style={{ borderRadius: 24, padding: 24, background: darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.2)' }}>
            <CalendarView appointments={appointments} getDoctorById={getDoctorById} darkMode={darkMode} navigate={navigate} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filtered.map((apt, i) => {
                  const doc = getDoctorById(apt.doctorId);
                  return (
                    <motion.div key={apt.id} layout
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                      whileHover={{ x: 6 }}
                      onClick={() => navigate(`/appointment/${apt.id}`)}
                      style={card}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${doc?.avatarColor}, ${doc?.avatarColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                        {doc?.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <h3 style={{ fontWeight: 700, fontSize: 16, color: textPrimary, margin: 0 }}>{doc?.name}</h3>
                          {getStatusBadge(apt.status)}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{doc?.specialty} • {doc?.hospital}</div>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
                            <Calendar size={13} /> {apt.date}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                            <Clock size={13} /> {apt.time}
                          </div>
                          {apt.patientName && (
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>👤 {apt.patientName}</div>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={20} color="#94a3b8" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '60px 20px', background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 28 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <h3 style={{ color: textPrimary, fontWeight: 700, marginBottom: 8 }}>No appointments found</h3>
                <p style={{ color: '#64748b', fontSize: 14 }}>Try adjusting your filters or book a new appointment!</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/chat')}
                  style={{ marginTop: 24, padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>
                  🤖 Book with Medi AI
                </motion.button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
