import React from 'react';
import { motion } from 'framer-motion';

export default function PageWrapper({ children, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ minHeight: 'calc(100vh - 64px)', ...style }}
    >
      {children}
    </motion.div>
  );
}
