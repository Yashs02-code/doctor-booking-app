import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Sparkles, Calendar, AlertCircle, Phone, ArrowRight } from 'lucide-react';

function QuickSuggestion({ icon, text, onClick, darkMode }) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
        ${darkMode 
          ? 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300' 
          : 'bg-white hover:bg-gray-50 border border-slate-200 text-slate-600 shadow-sm'}`}
    >
      {icon}
      <span>{text}</span>
    </motion.button>
  );
}

export default function AISupportCard({ darkMode, onChatClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden p-6 rounded-2xl border transition-all
        ${darkMode 
          ? 'bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-950 border-indigo-500/20 shadow-2xl' 
          : 'bg-gradient-to-br from-indigo-50 via-white to-blue-50 border-indigo-100 shadow-xl'}`}
    >
      {/* Decorative Blur */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 bg-indigo-500`} />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              AI Support Assistant
            </h3>
            <p className={`text-sm ${darkMode ? 'text-indigo-300/80' : 'text-indigo-600/80 font-medium'}`}>
              Powered by Medi AI
            </p>
          </div>
        </div>

        <p className={`mb-6 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Need help? Our intelligent assistant can help you with bookings, account issues, or guide you through our features instantly.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <QuickSuggestion icon={<Calendar size={14} className="text-blue-500" />} text="Book appointment" darkMode={darkMode} />
          <QuickSuggestion icon={<AlertCircle size={14} className="text-amber-500" />} text="Fix booking issue" darkMode={darkMode} />
          <QuickSuggestion icon={<Phone size={14} className="text-emerald-500" />} text="Contact support" darkMode={darkMode} />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onChatClick}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow-lg shadow-indigo-600/30"
        >
          <MessageSquare size={18} />
          <span>Ask our AI Assistant</span>
          <ArrowRight size={16} className="ml-1 opacity-70" />
        </motion.button>
      </div>
    </motion.div>
  );
}
