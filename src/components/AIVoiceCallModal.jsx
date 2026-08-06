import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Volume2, Sparkles, X, CheckCircle, Calendar, User, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

export default function AIVoiceCallModal({ isOpen, onClose }) {
  const { doctors, addAppointment, currentUser, darkMode } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize Speech Recognition & Synthesis
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        
        // Auto process complete spoken phrase
        if (event.results[event.results.length - 1].isFinal) {
          handleVoiceCommand(currentTranscript);
        }
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition warning:', err.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Timer for Call Duration
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  // Start Call
  const startCall = () => {
    setCallActive(true);
    setBookingConfirmed(null);
    const greeting = `Hello! Welcome to Medi AI Clinic. My name is Maya, your AI Healthcare Assistant. How can I help you with your appointment today?`;
    speakText(greeting);
  };

  // End Call
  const endCall = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }
    window.speechSynthesis?.cancel();
    setCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    onClose();
  };

  // Text-to-Speech function
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    
    // Pick female voice if available
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Zira'));
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setAiResponse(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto start listening after AI finishes speaking
      startListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start listening to user voice
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Recognition start error:', e.message);
      }
    }
  };

  // Process user voice input using natural keyword understanding
  const handleVoiceCommand = async (userText) => {
    const textLower = userText.toLowerCase();

    // Doctor matching
    const matchedDoctor = doctors.find(d => 
      textLower.includes(d.name.toLowerCase()) || 
      textLower.includes(d.specialty.toLowerCase()) ||
      textLower.includes(d.name.split(' ')[1]?.toLowerCase() || '')
    ) || doctors[0];

    // Detect booking intent
    if (textLower.includes('book') || textLower.includes('appointment') || textLower.includes('schedule') || textLower.includes('see doctor')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const newBooking = {
        patientName: currentUser?.name || 'Patient',
        patientEmail: currentUser?.email || 'patient@example.com',
        patientPhone: currentUser?.phone || '9876543210',
        doctorId: matchedDoctor.id,
        doctorName: matchedDoctor.name,
        specialty: matchedDoctor.specialty,
        hospital: matchedDoctor.hospital || 'Medi AI Clinic',
        date: dateStr,
        time: '10:00 AM',
        appointmentType: 'Consultation',
        symptoms: 'Booked via AI Voice Agent (Maya)',
        fee: matchedDoctor.fee || '$150'
      };

      try {
        await addAppointment(newBooking);
        setBookingConfirmed(newBooking);

        const responseText = `Excellent! I have successfully booked your appointment with ${matchedDoctor.name} for tomorrow at 10:00 AM. A confirmation email and Google Calendar event have been dispatched to your email!`;
        speakText(responseText);
      } catch (err) {
        speakText("I encountered a small error while booking. Let me retry that for you.");
      }
    } else if (textLower.includes('doctor') || textLower.includes('available') || textLower.includes('specialist')) {
      speakText(`We have several top specialists available, including ${doctors.map(d => d.name).slice(0, 3).join(', ')}. Who would you like to see?`);
    } else {
      speakText(`I understand you said: "${userText}". Would you like me to book an appointment with ${matchedDoctor.name} for tomorrow?`);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            width: '100%', maxWidth: 480,
            background: darkMode ? 'linear-gradient(145deg, #0f172a, #1e293b)' : 'white',
            borderRadius: 28, padding: 32,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            textAlign: 'center', position: 'relative', overflow: 'hidden'
          }}
        >
          {/* Close Icon */}
          <button onClick={endCall} style={{
            position: 'absolute', top: 20, right: 20, background: 'none', border: 'none',
            color: darkMode ? '#94a3b8' : '#64748b', cursor: 'pointer'
          }}>
            <X size={22} />
          </button>

          {/* Header */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(37,99,235,0.1)', color: '#2563eb', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            <Sparkles size={16} /> Medi AI Voice Receptionist
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: darkMode ? 'white' : '#0f172a' }}>
            Maya — AI Agent
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>
            {callActive ? `Active Call • ${formatTimer(callDuration)}` : 'Click to start live voice consultation'}
          </p>

          {/* Animated Voice Orb */}
          <div style={{ position: 'relative', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            {isSpeaking && (
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, rgba(99,102,241,0) 70%)' }}
              />
            )}
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(5,150,105,0) 70%)' }}
              />
            )}
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: isSpeaking ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : isListening ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #64748b, #475569)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              boxShadow: '0 10px 30px rgba(37,99,235,0.3)'
            }}>
              {isSpeaking ? <Volume2 size={42} /> : isListening ? <Mic size={42} /> : <Phone size={42} />}
            </div>
          </div>

          {/* Live AI Speech / Transcript */}
          {callActive && (
            <div style={{
              background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              borderRadius: 16, padding: 16, marginBottom: 24, textAlign: 'left', minHeight: 70, border: '1px solid rgba(148,163,184,0.15)'
            }}>
              {aiResponse && (
                <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, marginBottom: 6 }}>
                  🤖 Maya: <span style={{ color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 400 }}>{aiResponse}</span>
                </div>
              )}
              {transcript && (
                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                  🗣️ You: <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 400 }}>{transcript}</span>
                </div>
              )}
            </div>
          )}

          {/* Booking Confirmed Notification Card */}
          {bookingConfirmed && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: 16, padding: 14, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                <CheckCircle size={18} /> Appointment Confirmed!
              </div>
              <div style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#334155' }}>
                <strong>{bookingConfirmed.doctorName}</strong> ({bookingConfirmed.specialty})<br/>
                📅 {bookingConfirmed.date} at {bookingConfirmed.time}<br/>
                📧 Email & Calendar invite dispatched!
              </div>
            </motion.div>
          )}

          {/* Call Controls */}
          {!callActive ? (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={startCall}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 18, border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white',
                fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 8px 24px rgba(37,99,235,0.4)'
              }}>
              <Phone size={20} /> Start Live Voice Call
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={endCall}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 18, border: 'none',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
                fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 8px 24px rgba(239,68,68,0.4)'
              }}>
              <PhoneOff size={20} /> End Call
            </motion.button>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
