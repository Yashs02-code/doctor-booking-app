import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Calendar, Zap, Mail, MessageSquare, Database, CheckCircle, ArrowRight, Play, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import PageWrapper from '../components/PageWrapper';

const nodes = [
  { id: 'ai',      label: 'AI Agent',       icon: <Bot />,         color: '#2563eb', x: 0,   y: 0 },
  { id: 'booking', label: 'Booking Logic',  icon: <Calendar />,    color: '#10b981', x: 200, y: 0 },
  { id: 'n8n',     label: 'n8n Trigger',     icon: <Zap />,         color: '#f59e0b', x: 400, y: 0 },
  { id: 'sms',     label: 'Send SMS',        icon: <MessageSquare />, color: '#ec4899', x: 600, y: -80 },
  { id: 'email',   label: 'Send Email',      icon: <Mail />,          color: '#7c3aed', x: 600, y: 0 },
  { id: 'db',      label: 'Update DB',       icon: <Database />,      color: '#0891b2', x: 600, y: 80 },
  { id: 'done',    label: 'Confirmed',       icon: <CheckCircle />,   color: '#10b981', x: 800, y: 0 },
];

const edges = [
  { from: 'ai',      to: 'booking' },
  { from: 'booking', to: 'n8n' },
  { from: 'n8n',     to: 'sms' },
  { from: 'n8n',     to: 'email' },
  { from: 'n8n',     to: 'db' },
  { from: 'sms',     to: 'done' },
  { from: 'email',   to: 'done' },
  { from: 'db',      to: 'done' },
];

export default function AutomationDiagram() {
  const { darkMode } = useApp();
  const [activeNode, setActiveNode] = useState(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);

  const startSimulation = () => {
    setRunning(true);
    setStep(0);
  };

  useEffect(() => {
    if (!running) return;
    const sequence = ['ai', 'booking', 'n8n', 'sms', 'email', 'db', 'done'];
    if (step < sequence.length) {
      const timer = setTimeout(() => {
        setActiveNode(sequence[step]);
        setStep(step + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => {
        setRunning(false);
        setActiveNode(null);
      }, 2000);
    }
  }, [running, step]);

  const card = {
    borderRadius: 24, padding: 32,
    background: darkMode ? 'rgba(20,30,60,0.7)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(30px)',
    border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.2)',
  };

  return (
    <PageWrapper>
      <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: darkMode ? '#e2e8f0' : '#0f172a', margin: 0 }}>n8n Automation</h1>
            <p style={{ color: '#64748b', marginTop: 6, fontSize: 16 }}>This diagram demonstrates the automated workflow triggered on every appointment booking.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={startSimulation}
            disabled={running}
            style={{
              padding: '12px 24px', borderRadius: 14, border: 'none',
              background: running ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: running ? 'none' : '0 10px 30px rgba(37,99,235,0.3)',
            }}
          >
            {running ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
            {running ? 'Simulating…' : 'Run Simulation'}
          </motion.button>
        </div>

        {/* Diagram Area */}
        <div style={{ 
          ...card, height: 500, overflow: 'hidden', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* Edge lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            {edges.map((edge, i) => {
              const from = nodes.find(n => n.id === edge.from);
              const to = nodes.find(n => n.id === edge.to);
              const x1 = 100 + from.x;
              const y1 = 250 + from.y;
              const x2 = 100 + to.x;
              const y2 = 250 + to.y;
              
              const isActive = activeNode === from.id || (activeNode === to.id && running);

              return (
                <g key={i}>
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                    strokeWidth="3"
                  />
                  {isActive && (
                    <motion.line
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8 }}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={from.color}
                      strokeWidth="3"
                      className="flow-line"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <motion.div
              key={node.id}
              animate={{ 
                scale: activeNode === node.id ? 1.15 : 1,
                boxShadow: activeNode === node.id ? `0 0 30px ${node.color}66` : '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: activeNode === node.id ? node.color : 'transparent'
              }}
              style={{
                position: 'absolute',
                left: 100 + node.x - 60,
                top: 250 + node.y - 45,
                width: 120,
                height: 90,
                borderRadius: 20,
                background: darkMode ? '#1e293b' : 'white',
                border: '2px solid transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                zIndex: 2,
              }}
            >
              <div style={{ 
                width: 36, height: 36, borderRadius: 10, 
                background: `${node.color}15`, color: node.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {node.id === activeNode ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                    {node.icon}
                  </motion.div>
                ) : node.icon}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: darkMode ? '#e2e8f0' : '#475569' }}>{node.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Console Log Simulator */}
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: darkMode ? '#e2e8f0' : '#475569', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
             Workflow Execution Logs
          </h3>
          <div style={{ 
            background: darkMode ? '#0a0f1e' : '#1e293b', 
            borderRadius: 16, padding: 20, 
            fontFamily: 'monospace', fontSize: 13, color: '#10b981',
            minHeight: 120, border: '1px solid rgba(16,185,129,0.3)'
          }}>
            <AnimatePresence>
              {running && step > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div>[13:51:02] Trigger received: New Booking Entry Created</div>
                  {step > 1 && <div>[13:51:03] Processing Data for Patient "Raj Patel"...</div>}
                  {step > 2 && <div>[13:51:04] Authentication OK. Connecting to n8n Cloud...</div>}
                  {step > 3 && <div style={{ color: '#ec4899' }}>[13:51:05] Branch SMS: Sending confirmation to +91 98765...</div>}
                  {step > 4 && <div style={{ color: '#7c3aed' }}>[13:51:05] Branch EMAIL: Sending receipt to raj.p@example.com...</div>}
                  {step > 5 && <div style={{ color: '#0891b2' }}>[13:51:06] Branch DB: Patching doctor's calendar (apt_id: {Math.floor(Math.random()*10000)})...</div>}
                  {step > 6 && <div style={{ color: 'white' }}>[13:51:07] Workflow completed successfully. ✅</div>}
                </motion.div>
              )}
              {!running && (
                <div style={{ color: '#64748b' }}>// Press "Run Simulation" to see the automation workflow in action</div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
