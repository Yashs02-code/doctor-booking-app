import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Activity, Calendar, MessageSquare, LayoutDashboard, TrendingUp, LogOut, User, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { darkMode, setDarkMode, demoMode, setDemoMode, currentUser, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  const navItems = [
    { path: '/home',            icon: <LayoutDashboard size={18} />, label: t('nav.home') },
    { path: '/chat',            icon: <MessageSquare size={18} />,   label: t('nav.ai_book'), role: 'patient' },
    { path: '/appointments',    icon: <Calendar size={18} />,        label: t('nav.appointments') },
    { path: '/doctor-dashboard',icon: <Activity size={18} />,        label: t('nav.doctor_portal'), role: 'doctor' },
    { path: '/insights',        icon: <TrendingUp size={18} />,      label: t('nav.insights'), role: 'doctor' },
  ].filter(item => !item.role || item.role === currentUser?.role);

  const handleLogout = () => { logout(); navigate('/auth'); setProfileOpen(false); setMobileMenuOpen(false); };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: darkMode ? 'rgba(10,15,30,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(148,163,184,0.15)',
        padding: '0 24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }} onClick={closeMobileMenu}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #f97316, #ef4444, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={20} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 18, background: 'linear-gradient(135deg, #f97316, #ef4444, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Medi AI
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="desktop-nav">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 10,
                    background: active ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                    color: active ? 'white' : darkMode ? '#94a3b8' : '#64748b',
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    transition: 'all 0.2s',
                  }}
                >
                  {item.icon} {item.label}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Dark mode */}
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setDarkMode(!darkMode)}
            style={{
              width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: darkMode ? '#fbbf24' : '#64748b',
            }}
            className="desktop-nav"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>

          {/* User avatar (Desktop) */}
          {currentUser && (
            <div style={{ position: 'relative' }} className="desktop-nav">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: 'white', fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {currentUser.avatar || currentUser.name?.charAt(0)}
              </motion.button>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  style={{
                    position: 'absolute', right: 0, top: 46, zIndex: 200,
                    background: darkMode ? '#1e293b' : 'white',
                    border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 14, boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                    padding: 8, minWidth: 180,
                  }}
                >
                  <div style={{ padding: '10px 14px', borderBottom: darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f1f5f9', marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? '#e2e8f0' : '#0f172a' }}>{currentUser.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{currentUser.email}</div>
                  </div>
                  <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => { navigate('/profile'); setProfileOpen(false); }} style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'transparent', color: darkMode ? '#e2e8f0' : '#475569', fontSize: 14, fontWeight: 500,
                      textAlign: 'left'
                    }}>
                      <User size={15} /> {t('nav.my_profile')}
                    </button>
                    <button onClick={handleLogout} style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'transparent', color: '#ef4444', fontSize: 14, fontWeight: 500,
                      textAlign: 'left'
                    }}>
                      <LogOut size={15} /> {t('nav.sign_out')}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Hamburger button (Mobile) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-nav-btn"
            style={{
              background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              color: darkMode ? 'white' : '#64748b',
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="mobile-nav-overlay"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="mobile-nav-menu"
              style={{
                background: darkMode ? '#0d1629' : '#ffffff',
                color: darkMode ? '#e2e8f0' : '#0f172a',
                borderLeft: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <span style={{ fontWeight: 800, fontSize: 20, color: darkMode ? 'white' : '#0f172a' }}>Menu</span>
                <button onClick={closeMobileMenu} style={{ background: 'none', border: 'none', color: darkMode ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {navItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }} onClick={closeMobileMenu}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px', borderRadius: 12,
                        background: active ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                        color: active ? 'white' : darkMode ? '#94a3b8' : '#475569',
                        fontSize: 15, fontWeight: active ? 600 : 500,
                      }}>
                        {item.icon} {item.label}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '0 8px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700
                  }}>
                    {currentUser?.avatar || currentUser?.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: darkMode ? 'white' : '#0f172a' }}>{currentUser?.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{currentUser?.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button onClick={() => { setDarkMode(!darkMode); }} style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: darkMode ? '#fbbf24' : '#475569', fontSize: 15, fontWeight: 500,
                    textAlign: 'left'
                  }}>
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />} {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button onClick={() => { navigate('/profile'); closeMobileMenu(); }} style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: darkMode ? '#94a3b8' : '#475569', fontSize: 15, fontWeight: 500,
                    textAlign: 'left'
                  }}>
                    <User size={18} /> {t('nav.my_profile')}
                  </button>
                  <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: '#ef4444', fontSize: 15, fontWeight: 500,
                    textAlign: 'left'
                  }}>
                    <LogOut size={18} /> {t('nav.sign_out')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
