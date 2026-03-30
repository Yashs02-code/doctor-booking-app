import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import { TrendingUp, Clock, DollarSign, XCircle, Brain, Sparkles, ChevronRight, Zap, Globe, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { hourlyStats, weeklyTrend, specialtyDistribution, aiInsights } from '../data/dummyData';
import PageWrapper from '../components/PageWrapper';

const COLORS = ['#10b981','#ef4444','#7c3aed','#f59e0b','#ec4899','#0891b2','#d946ef'];

function KpiCard({ icon, label, value, sub, color, delay, darkMode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{
        borderRadius: 20, padding: 24,
        background: darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.2)',
        boxShadow: `0 8px 32px ${color}18`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(icon, { size: 20, color })}
        </div>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: darkMode ? '#e2e8f0' : '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color, fontWeight: 700, marginTop: 6 }}>{sub}</div>
    </motion.div>
  );
}

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
        <div key={i} style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.value} {p.name}</div>
      ))}
    </div>
  );
};

export default function Insights() {
  const { darkMode, appointments } = useApp();
  const [activeInsight, setActiveInsight] = useState(null);

  const textPrimary = darkMode ? '#e2e8f0' : '#0f172a';
  const chartGrid = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const chartAxis = darkMode ? '#475569' : '#94a3b8';

  const card = {
    borderRadius: 24, padding: 28,
    background: darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.2)',
  };

  const cancellationRate = appointments.length
    ? Math.round((appointments.filter(a => a.status === 'cancelled').length / appointments.length) * 100)
    : 12;
  const totalRev = appointments.filter(a => a.status === 'confirmed').length * 680;

  return (
    <PageWrapper>
      <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: textPrimary, margin: 0 }}>AI Insights</h1>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Intelligent analytics powered by Medi AI</p>
            </div>
          </div>
        </motion.div>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 32 }}>
          <KpiCard icon={<Clock />} label="Peak Booking Hour" value="5 PM" sub="↑ 52 bookings/day avg" color="#f59e0b" delay={0} darkMode={darkMode} />
          <KpiCard icon={<TrendingUp />} label="Avg Wait Time" value="8 min" sub="↓ 22% vs last month" color="#10b981" delay={0.1} darkMode={darkMode} />
          <KpiCard icon={<DollarSign />} label="Est. Monthly Revenue" value={`₹${(totalRev + 480000).toLocaleString('en-IN')}`} sub="↑ 18% growth" color="#2563eb" delay={0.2} darkMode={darkMode} />
          <KpiCard icon={<XCircle />} label="Cancellation Rate" value={`${cancellationRate}%`} sub="↓ 3% improvement" color="#ef4444" delay={0.3} darkMode={darkMode} />
        </div>

        {/* Charts Row 1: Peak Hours + Trend */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, marginBottom: 24 }}>
          {/* Peak Hours Bar Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={card}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, marginBottom: 6 }}>Peak Booking Hours</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Hourly demand distribution for appointment requests</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourlyStats} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} cursor={{ fill: `${chartGrid}` }} />
                <Bar dataKey="bookings" name="bookings" fill="url(#peakGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* 30-Day Trend Line Chart */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} style={card}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, marginBottom: 6 }}>30-Day Appointment Trend</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Daily appointments booked over the past month</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: chartAxis, fontSize: 10 }} axisLine={false} tickLine={false}
                  interval={4} />
                <YAxis tick={{ fill: chartAxis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                <Area type="monotone" dataKey="appointments" name="appointments" stroke="#10b981"
                  strokeWidth={2.5} fill="url(#trendGrad)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Charts Row 2: Specialty Pie + AI Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, marginBottom: 24 }}>
          {/* Specialty Distribution Donut */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={card}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, marginBottom: 6 }}>Specialty Distribution</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Bookings by medical department</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={specialtyDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={3}>
                  {specialtyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [`${val}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {specialtyDistribution.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#64748b', flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Generated Insights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, margin: 0 }}>AI-Generated Insights</h3>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Auto-analyzed by Medi AI engine</p>
              </div>
              <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 20, background: 'linear-gradient(135deg, #7c3aed22, #2563eb22)', border: '1px solid #7c3aed44' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed' }}>✨ LIVE</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {aiInsights.map((insight, i) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                  onClick={() => setActiveInsight(activeInsight === insight.id ? null : insight.id)}
                  whileHover={{ x: 4 }}
                  style={{
                    padding: '14px 18px', borderRadius: 16, cursor: 'pointer',
                    background: darkMode ? 'rgba(255,255,255,0.04)' : `${insight.color}08`,
                    border: `1px solid ${insight.color}30`,
                    borderLeft: `4px solid ${insight.color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{insight.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: textPrimary }}>{insight.title}</div>
                      {activeInsight === insight.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>
                          {insight.detail}
                        </motion.div>
                      )}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                      background: `${insight.color}20`, color: insight.color, textTransform: 'uppercase',
                    }}>{insight.impact}</span>
                    <ChevronRight size={14} color="#94a3b8"
                      style={{ transform: activeInsight === insight.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Future Scope Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ ...card, background: darkMode ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Sparkles size={22} color="#7c3aed" />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: textPrimary, margin: 0 }}>Future Capabilities</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.15)', padding: '2px 10px', borderRadius: 20 }}>Coming Soon</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { icon: <Zap size={22} />, title: 'Voice AI Agent', desc: 'Book appointments hands-free using natural voice commands', color: '#f59e0b' },
              { icon: <Globe size={22} />, title: 'Multi-Language Support', desc: 'Support for 12+ languages including Hindi, Marathi, Tamil', color: '#10b981' },
              { icon: <Calendar size={22} />, title: 'Google Calendar Sync', desc: 'Bi-directional sync with Google, Outlook & Apple Calendar', color: '#2563eb' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '16px', borderRadius: 16, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {React.cloneElement(f.icon, { color: f.color })}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: textPrimary, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
