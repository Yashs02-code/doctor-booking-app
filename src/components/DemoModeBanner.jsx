import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Zap } from 'lucide-react';

export default function DemoModeBanner() {
  const { demoMode } = useApp();
  return (
    <AnimatePresence>
      {demoMode && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          style={{
            background: 'linear-gradient(90deg, #f59e0b, #d97706)',
            color: 'white',
            textAlign: 'center',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            zIndex: 200,
          }}
        >
          <Zap size={14} />
          ⚡ Medi AI  — Demo Mode Active. Sample data loaded for competition demonstration.
          <Zap size={14} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
