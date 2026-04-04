import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Settings, 
  BookOpen, 
  ShieldCheck, 
  AlertTriangle, 
  Mail, 
  ChevronLeft 
} from 'lucide-react';
import AISupportCard from './AISupportCard';
import SupportCategoryCard from './SupportCategoryCard';

interface HelpSupportProps {
  onBack: () => void;
  darkMode: boolean;
}

export default function HelpSupport({ onBack, darkMode }: HelpSupportProps) {
  const categories = [
    {
      id: 'appointment',
      icon: Calendar,
      title: 'Appointment Issues',
      description: 'Get help with rescheduling or canceling',
      color: 'blue'
    },
    {
      id: 'account',
      icon: Settings,
      title: 'Account & Settings',
      description: 'Manage your profile and preferences',
      color: 'amber'
    },
    {
      id: 'how-it-works',
      icon: BookOpen,
      title: 'How It Works',
      description: 'Learn how to use FirePulse AI',
      color: 'indigo'
    },
    {
      id: 'privacy',
      icon: ShieldCheck,
      title: 'Privacy & Security',
      description: 'Data protection and account safety',
      color: 'emerald'
    },
    {
      id: 'report',
      icon: AlertTriangle,
      title: 'Report Issue',
      description: 'Tell us about a bug or problem',
      color: 'rose'
    },
    {
      id: 'contact',
      icon: Mail,
      title: 'Contact Us',
      description: 'Speak with our support team',
      color: 'blue'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white text-slate-500 hover:text-slate-900 shadow-sm border'}`}
        >
          <ChevronLeft size={20} />
        </motion.button>
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Help & Support</h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Get quick answers and expert support</p>
        </div>
      </div>

      <AISupportCard darkMode={darkMode} onChatClick={() => console.log('AI Chat opened')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <SupportCategoryCard
            key={cat.id}
            icon={cat.icon}
            title={cat.title}
            description={cat.description}
            darkMode={darkMode}
            color={cat.color}
            onClick={() => console.log(`Category ${cat.id} clicked`)}
          />
        ))}
      </div>
    </motion.div>
  );
}
