import React from 'react';
import { motion } from 'framer-motion';

export default function SupportCategoryCard({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  darkMode,
  color = 'blue'
}) {
  
  const getColors = () => {
    switch(color) {
      case 'amber': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'emerald': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'indigo': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'rose': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group flex flex-col items-start p-5 rounded-2xl border text-left transition-all w-full
        ${darkMode 
          ? 'bg-slate-900/60 border-slate-800/50 hover:bg-slate-800/80 hover:border-slate-700/50' 
          : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md'}`}
    >
      <div className={`p-3 rounded-xl mb-4 transition-transform group-hover:scale-110 ${getColors()}`}>
        <Icon size={24} />
      </div>
      
      <h4 className={`text-base font-bold mb-1 transition-colors
        ${darkMode ? 'text-slate-100 group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'}`}>
        {title}
      </h4>
      
      <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {description}
      </p>
    </motion.button>
  );
}
