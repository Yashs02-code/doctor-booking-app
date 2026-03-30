import React, { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';

export default function ConfettiWrapper() {
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [show, setShow] = useState(true);

  useEffect(() => {
    const handler = () => setDims({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    const timer = setTimeout(() => setShow(false), 5000);
    return () => { window.removeEventListener('resize', handler); clearTimeout(timer); };
  }, []);

  if (!show) return null;
  return (
    <ReactConfetti
      width={dims.width}
      height={dims.height}
      colors={['#2563eb', '#10b981', '#7c3aed', '#f59e0b', '#ec4899', '#06b6d4']}
      numberOfPieces={220}
      recycle={false}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
    />
  );
}
