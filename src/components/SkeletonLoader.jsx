import React from 'react';
import { useApp } from '../context/AppContext';

export function SkeletonCard() {
  const { darkMode } = useApp();
  const cls = darkMode ? 'skeleton-dark' : 'skeleton';
  return (
    <div style={{
      borderRadius: 20, padding: 24, marginBottom: 16,
      background: darkMode ? 'rgba(20,30,60,0.5)' : 'rgba(255,255,255,0.6)',
      border: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(148,163,184,0.15)',
    }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div className={cls} style={{ width: 64, height: 64, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className={cls} style={{ height: 18, width: '60%', marginBottom: 8 }} />
          <div className={cls} style={{ height: 14, width: '40%' }} />
        </div>
      </div>
      <div className={cls} style={{ height: 14, width: '80%', marginBottom: 8 }} />
      <div className={cls} style={{ height: 14, width: '60%', marginBottom: 16 }} />
      <div className={cls} style={{ height: 44, borderRadius: 12 }} />
    </div>
  );
}

export function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  const { darkMode } = useApp();
  return <div className={darkMode ? 'skeleton-dark' : 'skeleton'} style={{ height, width, borderRadius: 6, ...style }} />;
}

export default function SkeletonLoader({ count = 3 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
