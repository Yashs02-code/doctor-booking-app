import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import { AppProvider, useApp } from './context/AppContext';

// Eagerly loaded (critical path)
import SplashScreen    from './pages/SplashScreen';
import LanguageSelect  from './pages/LanguageSelect';
import Auth            from './pages/Auth';
import Navbar          from './components/Navbar';
import DemoModeBanner  from './components/DemoModeBanner';

// Code-split: lazy load non-critical pages to reduce initial bundle
const Home              = lazy(() => import('./pages/Home'));
const AIChat            = lazy(() => import('./pages/AIChat'));
const AppointmentList   = lazy(() => import('./pages/AppointmentList'));
const AppointmentDetail = lazy(() => import('./pages/AppointmentDetail'));
const Confirmation      = lazy(() => import('./pages/Confirmation'));
const DoctorDashboard   = lazy(() => import('./pages/DoctorDashboard'));
const AutomationDiagram = lazy(() => import('./pages/AutomationDiagram'));
const Insights          = lazy(() => import('./pages/Insights'));
const ProfilePage       = lazy(() => import('./pages/ProfilePage'));

function LazyFallback() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, loading } = useApp();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/auth" />;
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/home" />;
  }
  return children;
}

function AppRoutes() {
  const { loading, darkMode } = useApp();
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
      <Suspense fallback={<LazyFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"             element={<SplashScreen />} />
            <Route path="/language"     element={<LanguageSelect />} />
            <Route path="/auth"         element={<Auth />} />
            <Route path="/home"         element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/chat"         element={<ProtectedRoute allowedRoles={['patient']}><AIChat /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><AppointmentList /></ProtectedRoute>} />
            <Route path="/appointment/:id" element={<ProtectedRoute><AppointmentDetail /></ProtectedRoute>} />
            <Route path="/confirmation/:id" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
            <Route path="/doctor-dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/automation"   element={<ProtectedRoute allowedRoles={['doctor']}><AutomationDiagram /></ProtectedRoute>} />
            <Route path="/insights"     element={<ProtectedRoute allowedRoles={['doctor']}><Insights /></ProtectedRoute>} />
            <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
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
