import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Shield, 
  Settings, 
  Calendar, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Camera,
  Bell,
  CreditCard,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import HelpSupport from '../components/profile/HelpSupport';

interface ProfileMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  darkMode: boolean;
  danger?: boolean;
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ icon, label, onClick, darkMode, danger }) => (
  <motion.button
    whileHover={{ x: 4, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors
      ${darkMode ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'} 
      ${danger ? 'text-rose-500' : darkMode ? 'text-slate-300' : 'text-slate-700'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg 
        ${danger ? 'bg-rose-500/10' : darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
        {icon}
      </div>
      <span className="font-semibold">{label}</span>
    </div>
    <ChevronRight size={18} className="opacity-40" />
  </motion.button>
);

export default function ProfilePage() {
  const { currentUser, logout, darkMode } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'help'>('profile');

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const menuItems = [
    { label: 'My Appointments', icon: <Calendar size={20} />, onClick: () => navigate('/appointments'), danger: false },
    { label: 'Notifications', icon: <Bell size={20} />, onClick: () => {}, danger: false },
    { label: 'Payment Methods', icon: <CreditCard size={20} />, onClick: () => {}, danger: false },
    { label: 'Settings', icon: <Settings size={20} />, onClick: () => {}, danger: false },
    { label: 'Help & Support', icon: <HelpCircle size={20} />, onClick: () => setActiveTab('help'), danger: false },
    { label: 'Logout', icon: <LogOut size={20} />, onClick: handleLogout, danger: true },
  ];

  if (!currentUser) return null;

  return (
    <div className={`min-h-screen py-8 px-4 md:px-8 transition-colors ${darkMode ? 'bg-[#0a0f1e] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto">
        
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Header Card */}
              <div className={`relative overflow-hidden p-6 sm:p-10 rounded-3xl border transition-all
                ${darkMode 
                  ? 'bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-950 border-white/5 shadow-2xl' 
                  : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 z-10 relative">
                  {/* Avatar Section */}
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-500 p-1 shadow-2xl shadow-indigo-500/20">
                      <div className="w-full h-full rounded-[20px] overflow-hidden bg-white flex items-center justify-center text-4xl sm:text-5xl font-black text-indigo-600">
                        {currentUser.avatar || currentUser.name?.charAt(0)}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute -bottom-2 -right-2 p-2 sm:p-3 rounded-2xl bg-indigo-600 text-white shadow-lg border-4 border-white dark:border-slate-900"
                    >
                      <Camera size={16} />
                    </motion.button>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 text-center md:text-left space-y-6">
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2">
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{currentUser.name}</h1>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                          <CheckCircle2 size={14} className="text-blue-500" />
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Verified</span>
                        </div>
                      </div>
                      <p className="text-sm sm:text-lg font-medium text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider
                        ${darkMode ? 'bg-white/5 text-indigo-400 border border-white/5' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                        {currentUser.role || 'User Account'}
                      </span>
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider
                        ${darkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        Neural Sync Active
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-8 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-900 font-black transition-all shadow-xl text-sm uppercase tracking-widest"
                      >
                        <Edit2 size={16} /> Edit Profile
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 blur-[120px] opacity-20 rounded-full bg-indigo-600 -mr-32 -mt-32" />
              </div>

              {/* Menu Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`p-6 rounded-3xl border 
                  ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-6">Personal Settings</h3>
                  <div className="space-y-1">
                    {menuItems.slice(0, 3).map((item, idx) => (
                      <ProfileMenuItem 
                        key={idx} 
                        icon={item.icon} 
                        label={item.label} 
                        onClick={item.onClick} 
                        darkMode={darkMode}
                        danger={item.danger}
                      />
                    ))}
                  </div>
                </div>

                <div className={`p-6 rounded-3xl border 
                  ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-6">App & Support</h3>
                  <div className="space-y-1">
                    {menuItems.slice(3).map((item, idx) => (
                      <ProfileMenuItem 
                        key={idx} 
                        icon={item.icon} 
                        label={item.label} 
                        onClick={item.onClick} 
                        darkMode={darkMode}
                        danger={item.danger}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="text-center py-10">
                <p className={`text-sm font-medium opacity-30`}>Version 2.4.0 • Built with FirePulse AI Engine</p>
              </div>
            </motion.div>
          ) : (
            <HelpSupport 
              key="help" 
              darkMode={darkMode} 
              onBack={() => setActiveTab('profile')} 
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
