import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function SlotPicker({ slots, bookedSlots = [], selectedSlot, onSelect }) {
  const { darkMode } = useApp();

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {slots.map(slot => {
        const isBooked = bookedSlots.includes(slot);
        const isSelected = selectedSlot === slot;
        return (
          <motion.button
            key={slot}
            whileHover={!isBooked ? { scale: 1.08 } : {}}
            whileTap={!isBooked ? { scale: 0.95 } : {}}
            onClick={() => !isBooked && onSelect(slot)}
            className={`slot-chip ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            🕐 {slot}
          </motion.button>
        );
      })}
    </div>
  );
}
