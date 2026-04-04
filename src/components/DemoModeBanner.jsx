import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Zap } from 'lucide-react';

export default function DemoModeBanner() {
  const { demoMode } = useApp();
  
  // Banner is hidden in production — return null when not actively showing content
  if (!demoMode) return null;
  
  return null;
  
  // Uncomment below to show a demo mode banner when needed:
  // return (
  //   <AnimatePresence>
  //     {demoMode && (
  //       <motion.div
  //         initial={{ y: -40, opacity: 0 }}
  //         animate={{ y: 0, opacity: 1 }}
  //         exit={{ y: -40, opacity: 0 }}
  //         style={{
  //           background: 'linear-gradient(90deg, #f97316, #ef4444)',
  //           color: 'white',
  //           textAlign: 'center',
  //           padding: '8px 16px',
  //           fontSize: 13,
  //           fontWeight: 600,
  //           display: 'flex',
  //           alignItems: 'center',
  //           justifyContent: 'center',
  //           gap: 8,
  //           zIndex: 200,
  //         }}
  //       >
  //         <Zap size={14} />
  //         ⚡ Medi AI — Demo Mode Active. Sample data loaded for demonstration.
  //         <Zap size={14} />
  //       </motion.div>
  //     )}
  //   </AnimatePresence>
  // );
}
