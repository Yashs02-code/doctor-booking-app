import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Mic, Sparkles, ChevronUp, Zap, HelpCircle, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

export default function GlobalAgenticRAGWidget() {
  const { darkMode } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: '👋 Hello! I am **Medi AI**, your Autonomous Agentic RAG assistant. Ask me anything about clinic policies, insurance, doctor availability, or booking!',
      ts: Date.now(),
    },
  ]);

  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const handleSend = async (customText) => {
    const query = (customText || input).trim();
    if (!query) return;

    if (!customText) setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: query, ts: Date.now() }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/rag-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      const data = await response.json();
      setIsTyping(false);

      if (data && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: data.reply,
            actionTaken: data.actionTaken,
            ragDocs: data.ragDocs,
            ts: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: 'I could not process that request. Please try asking about clinic hours, insurance, or doctor availability.',
            ts: Date.now(),
          },
        ]);
      }
    } catch (err) {
      console.error('Error querying RAG agent:', err);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: '⚠️ Network issue contacting Agentic RAG engine. Please try again.',
          ts: Date.now(),
        },
      ]);
    }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    const r = new SR();
    r.lang = 'en-IN';
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      handleSend(transcript);
    };
    r.onend = () => setListening(false);
    r.start();
    setListening(true);
    toast('🎤 Listening for your question...');
  };

  const promptChips = [
    { label: '💳 Insurance', query: 'What health insurance plans are accepted?' },
    { label: '🧪 Fasting Rules', query: 'What are the pre-appointment lab fasting rules?' },
    { label: '🕒 Working Hours', query: 'What are the clinic opening hours and Sunday schedule?' },
    { label: '👨‍⚕️ Doctors', query: 'Which medical specialties and doctors do you have?' },
  ];

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: 'Inter, sans-serif' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            style={{
              width: 'clamp(320px, 90vw, 420px)',
              height: 540,
              borderRadius: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              background: darkMode ? '#0f172a' : '#ffffff',
              border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(37,99,235,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb, #7c3aed)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot size={22} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Medi AI Assistant
                    <span style={{ fontSize: 9, background: '#10b981', padding: '2px 6px', borderRadius: 8, fontWeight: 900 }}>
                      RAG HYBRID
                    </span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={10} color="#fbbf24" /> Autonomous Vector + BM25 Engine
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages body */}
            <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, background: darkMode ? '#0b1329' : '#f8fafc' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : darkMode ? '#1e293b' : '#ffffff',
                      color: msg.role === 'user' ? 'white' : darkMode ? '#f1f5f9' : '#0f172a',
                      fontSize: 13,
                      lineHeight: 1.55,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      border: msg.role === 'ai' ? (darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0') : 'none',
                    }}
                    dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }}
                  />

                  {msg.actionTaken && (
                    <div style={{ fontSize: 10, color: '#2563eb', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Activity size={10} /> Action: {msg.actionTaken}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div style={{ display: 'flex', gap: 6, padding: '8px 14px', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: 16, width: 'fit-content' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', animation: 'bounce 0.8s infinite 0s' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', animation: 'bounce 0.8s infinite 0.2s' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', animation: 'bounce 0.8s infinite 0.4s' }} />
                </div>
              )}

              <div ref={scrollRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div style={{ padding: '8px 12px', background: darkMode ? '#0f172a' : '#f1f5f9', display: 'flex', gap: 6, overflowX: 'auto', borderTop: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e2e8f0' }}>
              {promptChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleSend(chip.query)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    background: darkMode ? 'rgba(37,99,235,0.2)' : 'white',
                    border: '1px solid rgba(37,99,235,0.3)',
                    color: darkMode ? '#93c5fd' : '#2563eb',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div style={{ padding: 12, background: darkMode ? '#0f172a' : '#ffffff', display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Ask clinic question or book slot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 20,
                  border: darkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                  background: darkMode ? '#1e293b' : '#f8fafc',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  fontSize: 13,
                  outline: 'none',
                }}
              />

              <button
                onClick={startVoice}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: listening ? '#ef4444' : darkMode ? '#334155' : '#e2e8f0',
                  color: listening ? 'white' : darkMode ? '#94a3b8' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mic size={16} />
              </button>

              <button
                onClick={() => handleSend()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          color: 'white',
          boxShadow: '0 8px 30px rgba(37,99,235,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Bot size={28} />
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#10b981',
            border: '3px solid white',
          }}
        />
      </motion.button>
    </div>
  );
}
