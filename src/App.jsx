import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import { AppProvider, useApp } from './context/AppContext';

import SplashScreen    from './pages/SplashScreen';
import LanguageSelect  from './pages/LanguageSelect';
import Auth            from './pages/Auth';
import Home            from './pages/Home';
import AIChat          from './pages/AIChat';
import AppointmentList from './pages/AppointmentList';
import AppointmentDetail from './pages/AppointmentDetail';
import Confirmation    from './pages/Confirmation';
import DoctorDashboard from './pages/DoctorDashboard';
import AutomationDiagram from './pages/AutomationDiagram';
import Insights         from './pages/Insights';
import Navbar          from './components/Navbar';
import DemoModeBanner  from './components/DemoModeBanner';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useApp();
  if (loading) return null; // Or a loading spinner
  return currentUser ? children : <Navigate to="/auth" />;
}

function AppRoutes() {
  const { loading, currentUser, darkMode } = useApp();
  const location = useLocation();

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%' }} />
    </div>
  );
  const hideNav = ['/', '/language', '/auth'].includes(location.pathname);

  return (
    <div className={darkMode ? 'dark' : ''} style={{ minHeight: '100vh' }}>
      <DemoModeBanner />
      {!hideNav && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"             element={<SplashScreen />} />
          <Route path="/language"     element={<LanguageSelect />} />
          <Route path="/auth"         element={<Auth />} />
          <Route path="/home"         element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/chat"         element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><AppointmentList /></ProtectedRoute>} />
          <Route path="/appointment/:id" element={<ProtectedRoute><AppointmentDetail /></ProtectedRoute>} />
          <Route path="/confirmation/:id" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
          <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/automation"   element={<ProtectedRoute><AutomationDiagram /></ProtectedRoute>} />
          <Route path="/insights"     element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: darkMode ? '#1e293b' : '#fff',
            color: darkMode ? '#e2e8f0' : '#0f172a',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
