import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Volume2, Sparkles, X, CheckCircle, Calendar, User, Clock, RefreshCw, XCircle, Info, Star, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { symptomsToDoctorMap } from '../data/dummyData';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const STEPS = ['mode', 'name', 'age', 'gender', 'symptoms', 'doctor', 'type', 'date', 'slot', 'confirm'];

// ─── Strict Name Validation (Same as AIChat.jsx) ──────────────────────────────
const FAKE_NAME_BLOCKLIST = [
  'yyy', 'xyz', 'xyx', 'abc', 'aaa', 'bbb', 'ccc', 'zzz', 'xxx',
  'qwe', 'qwerty', 'asdf', 'zxcv', 'test', 'testing', 'demo', 'fake', 'dummy',
  'hello', 'user', 'name', 'someone', 'nobody', 'anonymous', 'temp', 'null', 'none',
  'nnn', 'mmm', 'lll', 'kkk', 'jjj', 'iii', 'hhh', 'ggg', 'fff', 'eee', 'ddd',
  'john', 'jane', 'test1', 'admin', 'root', 'pass', 'password', 'asdf', 'qwerty',
];

function validateNameStrict(val) {
  const trimmed = (val || '').trim();
  if (trimmed.length < 5) return { valid: false, reason: 'too_short' };
  if (!/^[a-zA-Z\s'\-\.]+$/.test(trimmed)) return { valid: false, reason: 'invalid_chars' };
  
  const words = trimmed.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) return { valid: false, reason: 'needs_full_name' };
  
  for (const word of words) {
    if (word.length < 2) return { valid: false, reason: 'word_too_short' };
    if (FAKE_NAME_BLOCKLIST.includes(word)) return { valid: false, reason: 'blocked_word' };
    if (word.length >= 2 && new Set(word).size === 1) return { valid: false, reason: 'repeated_chars' };
    
    const charCounts = {};
    for (const char of word) charCounts[char] = (charCounts[char] || 0) + 1;
    const maxCount = Math.max(...Object.values(charCounts));
    if (maxCount / word.length > 0.5) return { valid: false, reason: 'too_many_repeats' };
    
    const hasVowel = /[aeiou]/.test(word);
    const hasConsonant = /[bcdfghjklmnpqrstvwxyz]/.test(word);
    if (!hasVowel || !hasConsonant) return { valid: false, reason: 'unrealistic_pattern' };
  }
  return { valid: true, reason: null };
}

function getNameErrorMessage(reason) {
  const messages = {
    too_short: 'Please speak or enter your full name with at least 5 characters, such as Rahul Sharma.',
    invalid_chars: 'Name should only contain letters and spaces. Please avoid numbers or symbols.',
    needs_full_name: 'Please speak your first name and last name. For example: John Doe or Priya Mehta.',
    word_too_short: 'Each name part should be at least two letters long.',
    blocked_word: 'That does not appear to be a real name. Please provide your authentic full name.',
    repeated_chars: 'Names should not have repeated characters like aaa or zzz.',
    too_many_repeats: 'Your name has too many repeated characters. Please enter your real name.',
    unrealistic_pattern: 'Please enter your actual full name, such as Rahul Sharma or Priya Patel.',
  };
  return messages[reason] || 'Please enter your valid real name with first and last name.';
}

function isValidName(val) {
  return validateNameStrict(val).valid;
}

export default function AIVoiceCallModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    doctors, 
    appointments, 
    bookAppointment, 
    cancelAppointment, 
    rescheduleAppointment, 
    updateAppointmentStatus, 
    getUpcomingAppointments,
    currentUser, 
    darkMode 
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  // Conversational state matching AIChat.jsx
  const [step, setStep] = useState('mode');
  const [mode, setMode] = useState(null); // 'book', 'reschedule', 'cancel', 'check'
  const [ctx, setCtx] = useState({});
  const [suggestedDoctor, setSuggestedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);
  const [selectedAptId, setSelectedAptId] = useState(null);
  const [done, setDone] = useState(false);
  const [messages, setMessages] = useState([]);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Mutable refs for active state inside callbacks
  const callActiveRef = useRef(callActive);
  const isSpeakingRef = useRef(isSpeaking);
  const doneRef = useRef(done);

  useEffect(() => { callActiveRef.current = callActive; }, [callActive]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { doneRef.current = done; }, [done]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Optimized for Indian English & global speech

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        
        if (event.results[event.results.length - 1].isFinal) {
          handleVoiceInput(currentTranscript);
        }
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition warning:', err.error);
        setIsListening(false);
        // Auto restart if call is active and AI is silent
        if (callActiveRef.current && !isSpeakingRef.current && !doneRef.current) {
          setTimeout(() => startListening(), 300);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Continuous voice loop: auto-restart listening if call is active and AI finished speaking
        if (callActiveRef.current && !isSpeakingRef.current && !doneRef.current) {
          setTimeout(() => startListening(), 200);
        }
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

  // Clean text for natural speech synthesis
  const cleanForSpeech = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\n+/g, '. ');
  };

  // Text-to-Speech
  const speakText = (text, onComplete) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Stop recognition while AI is speaking
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }

    const cleanMsg = cleanForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanMsg);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('India'));
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setAiResponse(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onComplete) {
        onComplete();
      } else {
        startListening();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start Speech Recognition reliably
  const startListening = () => {
    if (recognitionRef.current && !isSpeakingRef.current && callActiveRef.current) {
      try {
        setTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Recognition already started or busy, safely ignore
      }
    }
  };

  // Start Call
  const startCall = () => {
    setCallActive(true);
    setDone(false);
    setStep('mode');
    setMode(null);
    setCtx({});
    setMessages([]);
    
    const greeting = "Hello! Welcome to Medi AI Clinic. My name is Maya, your AI Voice Agent. What would you like to do today?";
    speakText(greeting);
  };

  // End Call
  const endCall = () => {
    callActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }
    window.speechSynthesis?.cancel();
    setCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    onClose();
  };

  // Detect Doctor Candidates by Symptoms
  function detectDoctors(symptoms) {
    const lower = (symptoms || '').toLowerCase();
    let specialtyMatch = '';
    for (const [key, [specialty]] of Object.entries(symptomsToDoctorMap)) {
      if (lower.includes(key)) {
        specialtyMatch = specialty;
        break;
      }
    }
    
    const specialties = [{name: 'General Physician'}, {name: 'Cardiologist'}, {name: 'Dermatologist'}, {name: 'Pediatrician'}];
    let candidates = specialties.map(s => doctors.find(d => d.specialty === s.name && d.available)).filter(Boolean);
    
    if (specialtyMatch) {
      const bestMatch = doctors.find(d => d.specialty === specialtyMatch && d.available);
      if (bestMatch) {
        candidates = [bestMatch, ...candidates.filter(d => d.id !== bestMatch.id)];
      }
    } else {
      const priya = doctors.find(d => d.id === 'd1');
      if (priya) {
        candidates = [priya, ...candidates.filter(d => d.id !== 'd1')];
      }
    }
    
    return candidates.slice(0, 5);
  }

  function getDateOptions() {
    const opts = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      opts.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    }
    return opts;
  }

  // 🧠 Natural NLP Multi-Entity Extraction Engine
  const extractEntitiesFromText = (text) => {
    const textLower = text.toLowerCase();
    const extracted = {};

    // 1. Name Extraction
    const nameMatch = text.match(/(?:my name is|i am|this is|call me)\s+([a-zA-Z\s]+)/i);
    if (nameMatch && nameMatch[1]) {
      const candidateName = nameMatch[1].trim();
      if (isValidName(candidateName)) {
        extracted.name = candidateName;
      }
    }

    // 2. Age Extraction
    const ageMatch = textLower.match(/\b(\d{1,2})\s*(?:years|year|yr|yrs|old)?\b/);
    if (ageMatch) {
      const parsedAge = parseInt(ageMatch[1], 10);
      if (parsedAge > 0 && parsedAge < 110) {
        extracted.age = parsedAge.toString();
      }
    }

    // 3. Gender Extraction
    if (textLower.includes('female') || textLower.includes('woman') || textLower.includes('girl')) {
      extracted.gender = 'Female';
    } else if (textLower.includes('male') || textLower.includes('man') || textLower.includes('boy')) {
      extracted.gender = 'Male';
    } else if (textLower.includes('other')) {
      extracted.gender = 'Other';
    }

    // 4. Symptoms Extraction
    for (const key of Object.keys(symptomsToDoctorMap)) {
      if (textLower.includes(key)) {
        extracted.symptoms = key;
        break;
      }
    }
    if (!extracted.symptoms && (textLower.includes('pain') || textLower.includes('fever') || textLower.includes('headache') || textLower.includes('cough') || textLower.includes('cold') || textLower.includes('checkup'))) {
      extracted.symptoms = text;
    }

    // 5. Doctor Matching
    const matchedDoc = doctors.find(d => 
      textLower.includes(d.name.toLowerCase()) || 
      textLower.includes(d.specialty.toLowerCase()) ||
      textLower.includes(d.name.split(' ')[1]?.toLowerCase() || '')
    );
    if (matchedDoc) {
      extracted.doctor = matchedDoc;
    }

    // 6. Date Extraction
    if (textLower.includes('today')) {
      extracted.date = new Date().toISOString().split('T')[0];
    } else if (textLower.includes('day after tomorrow')) {
      const d = new Date(); d.setDate(d.getDate() + 2);
      extracted.date = d.toISOString().split('T')[0];
    } else if (textLower.includes('tomorrow')) {
      const d = new Date(); d.setDate(d.getDate() + 1);
      extracted.date = d.toISOString().split('T')[0];
    }

    // 7. Time Extraction
    const timeMatch = textLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
    if (timeMatch) {
      extracted.time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3].toUpperCase()}`;
    }

    return extracted;
  };

  // Handle Voice or Button Input
  const handleVoiceInput = (val) => {
    const trimmedVal = val.trim();
    if (!trimmedVal || done) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmedVal }]);
    processStep(trimmedVal);
  };

  function processStep(val) {
    const lowerVal = val.toLowerCase();

    // Run Natural NLP Entity Extraction to populate accumulated context
    const entities = extractEntitiesFromText(val);
    const updatedCtx = { ...ctx, ...entities };
    if (Object.keys(entities).length > 0) {
      setCtx(updatedCtx);
    }

    // ⚡ INSTANT SHORTCUT DETECTION: Check if user spoke a full multi-entity booking command
    if (step === 'mode' && (lowerVal.includes('book') || lowerVal.includes('appointment')) && (lowerVal.includes('dr') || lowerVal.includes('tomorrow') || lowerVal.includes('today') || lowerVal.includes('am') || lowerVal.includes('pm'))) {
      handleInstantBookingShortcut(val);
      return;
    }

    if (step === 'mode') {
      if (lowerVal.includes('book') || lowerVal.includes('appointment') || lowerVal.includes('schedule') || lowerVal.includes('make') || lowerVal.includes('new') || lowerVal.includes('doctor') || lowerVal.includes('consult')) {
        setMode('book');
        setStep('name');
        speakText("Great! I can help you book an appointment. First, what is your full name?");
      } else if (lowerVal.includes('reschedule')) {
        setMode('reschedule');
        const upcoming = getUpcomingAppointments();
        setUserAppointments(upcoming);
        if (upcoming.length === 0) {
          setDone(true);
          speakText("You don't have any upcoming appointments to reschedule.");
        } else {
          setStep('doctor');
          speakText(`You have ${upcoming.length} upcoming appointment. Please select or speak the number of the appointment you would like to reschedule.`);
        }
      } else if (lowerVal.includes('cancel')) {
        setMode('cancel');
        const upcoming = getUpcomingAppointments();
        setUserAppointments(upcoming);
        if (upcoming.length === 0) {
          setDone(true);
          speakText("You don't have any upcoming appointments to cancel.");
        } else {
          setStep('doctor');
          speakText(`You have ${upcoming.length} upcoming appointment. Please select or speak the number of the appointment you would like to cancel.`);
        }
      } else if (lowerVal.includes('check') || lowerVal.includes('available')) {
        setMode('check');
        setStep('doctor');
        speakText("Which doctor would you like to check available slots for?");
      } else {
        speakText("Please choose: Book an appointment, Reschedule, Cancel, or Check available slots.");
      }
    } else if (step === 'name') {
      const nameInput = entities.name || val;
      const validation = validateNameStrict(nameInput);
      if (!validation.valid) {
        const errorMsg = getNameErrorMessage(validation.reason);
        speakText(errorMsg);
        return;
      }
      const newCtx = { ...updatedCtx, name: nameInput };
      setCtx(newCtx);
      setStep('age');
      speakText(`Thank you ${nameInput}. How old are you?`);
    } else if (step === 'age') {
      const ageInput = entities.age || val;
      const newCtx = { ...updatedCtx, age: ageInput };
      setCtx(newCtx);
      setStep('gender');
      speakText("Got it. What is your gender? Male, Female, or Other?");
    } else if (step === 'gender') {
      const genderInput = entities.gender || val;
      const newCtx = { ...updatedCtx, gender: genderInput };
      setCtx(newCtx);
      setStep('symptoms');
      speakText("Please describe your symptoms or what health issue you are experiencing.");
    } else if (step === 'symptoms') {
      const symptomsInput = entities.symptoms || val;
      const candidates = detectDoctors(symptomsInput);
      const newCtx = { ...updatedCtx, symptoms: symptomsInput, candidates };
      setCtx(newCtx);
      setStep('doctor');
      speakText(`Based on your symptoms, I recommend Dr. ${candidates[0].name}, ${candidates[0].specialty}. Would you like to proceed with Dr. ${candidates[0].name} or select another doctor?`);
    } else if (step === 'doctor') {
      if (mode === 'reschedule' || mode === 'cancel') {
        const aptIndex = parseInt(val) - 1;
        if (isNaN(aptIndex) || aptIndex < 0 || aptIndex >= userAppointments.length) {
          speakText("Invalid selection. Please select a valid appointment number.");
          return;
        }
        const selectedApt = userAppointments[aptIndex];
        setSelectedAptId(selectedApt.id);
        const doctor = doctors.find(d => d.id === selectedApt.doctorId);
        if (mode === 'reschedule') {
          speakText(`You selected your appointment with Dr. ${doctor?.name} on ${selectedApt.date} at ${selectedApt.time}. What new date would you like?`);
          setStep('date');
        } else {
          speakText(`You selected your appointment with Dr. ${doctor?.name} on ${selectedApt.date} at ${selectedApt.time}. Are you sure you want to cancel this appointment? Say Yes to confirm or No to keep it.`);
          setStep('confirm');
        }
      } else if (mode === 'check') {
        const normalizedInput = val.toLowerCase().replace('dr.', '').trim();
        const doc = entities.doctor || doctors.find(d => 
          d.id.toLowerCase() === normalizedInput || 
          d.name.toLowerCase().replace('dr.', '').trim() === normalizedInput ||
          d.name.toLowerCase().trim() === val.toLowerCase().trim()
        ) || doctors[0];

        setSuggestedDoctor(doc);
        setCtx({ ...updatedCtx, doctor: doc });
        setStep('date');
        speakText(`Checking available slots for Dr. ${doc.name}. What date would you like?`);
      } else {
        const normalizedInput = val.toLowerCase().replace('dr.', '').trim();
        const doc = entities.doctor || doctors.find(d => 
          d.id.toLowerCase() === normalizedInput || 
          d.name.toLowerCase().replace('dr.', '').trim() === normalizedInput ||
          d.name.toLowerCase().trim() === val.toLowerCase().trim()
        ) || (updatedCtx.candidates && updatedCtx.candidates[0]) || doctors[0];

        const newCtx = { ...updatedCtx, doctor: doc };
        setCtx(newCtx);
        setSuggestedDoctor(doc);
        setStep('type');
        speakText(`Excellent choice! What type of appointment would you like with Dr. ${doc.name}? Consultation or Check-up?`);
      }
    } else if (step === 'type') {
      const newCtx = { ...updatedCtx, appointmentType: val };
      setCtx(newCtx);
      setStep('date');
      speakText("Which date would you like to book for?");
    } else if (step === 'date') {
      const dateInput = entities.date || val;
      if (mode === 'check') {
        const doctor = updatedCtx.doctor;
        const slots = doctor?.slots?.[dateInput] || ['09:00', '10:30', '11:00', '14:00', '15:30'];
        const bSlots = doctor?.bookedSlots?.[dateInput] || [];
        const availableCount = slots.filter(s => !bSlots.includes(s)).length;
        setDone(true);
        speakText(`On ${dateInput}, Dr. ${doctor.name} has ${availableCount} available slot out of ${slots.length}.`);
      } else if (mode === 'reschedule') {
        const selectedApt = userAppointments.find(a => a.id === selectedAptId);
        const doctor = selectedApt ? doctors.find(d => d.id === selectedApt.doctorId) : updatedCtx.doctor;
        const slots = doctor?.slots?.[dateInput] || ['09:00', '10:30', '11:00', '14:00', '15:30'];
        const bSlots = doctor?.bookedSlots?.[dateInput] || [];
        const newCtx = { ...updatedCtx, date: dateInput };
        setCtx(newCtx);
        setAvailableSlots(slots);
        setBookedSlots(bSlots);
        setStep('slot');
        speakText(`Please select a time slot for ${dateInput}. Available slots include ${slots.filter(s => !bSlots.includes(s)).join(', ')}.`);
      } else {
        const doctor = updatedCtx.doctor || doctors[0];
        const slots = doctor?.slots?.[dateInput] || ['09:00', '10:30', '11:00', '14:00', '15:30'];
        const bSlots = doctor?.bookedSlots?.[dateInput] || [];
        const newCtx = { ...updatedCtx, date: dateInput };
        setCtx(newCtx);
        setAvailableSlots(slots);
        setBookedSlots(bSlots);
        setStep('slot');
        speakText(`Please select a time slot for ${dateInput}. Available slots include ${slots.filter(s => !bSlots.includes(s)).join(', ')}.`);
      }
    } else if (step === 'slot') {
      const slotInput = entities.time || val;
      if (bookedSlots.includes(slotInput)) {
        const nextAvailable = availableSlots.find(s => !bookedSlots.includes(s) && s !== slotInput);
        if (nextAvailable) {
          setSelectedSlot(nextAvailable);
          speakText(`The selected time slot ${slotInput} is already booked. I found the next available slot at ${nextAvailable}. Would you like to book it instead?`);
        } else {
          speakText("Sorry, all slots for this date are fully booked. Please select a different date.");
        }
        return;
      }

      if (mode === 'reschedule') {
        setStep('confirm');
        const apt = userAppointments.find(a => a.id === selectedAptId);
        const doctor = doctors.find(d => d.id === apt.doctorId);
        const newCtx = { ...updatedCtx, time: slotInput };
        setCtx(newCtx);
        speakText(`Confirm rescheduling appointment with Dr. ${doctor?.name} to ${updatedCtx.date} at ${slotInput}? Say Yes to confirm or No to cancel.`);
      } else {
        const newCtx = { ...updatedCtx, time: slotInput };
        setCtx(newCtx);
        setSelectedSlot(slotInput);
        setStep('confirm');
        speakText(`Please confirm your booking details: Patient ${newCtx.name}, Doctor ${newCtx.doctor?.name}, Date ${newCtx.date} at ${newCtx.time}. Fee is ₹${newCtx.doctor?.fee}. Say Yes to confirm or No to cancel.`);
      }
    } else if (step === 'confirm') {
      if (mode === 'reschedule') {
        if (lowerVal.startsWith('y') || lowerVal.includes('yes') || lowerVal.includes('ok') || lowerVal.includes('confirm')) {
          executeReschedule();
        } else {
          setDone(true);
          speakText("Rescheduling cancelled.");
        }
      } else if (mode === 'cancel') {
        if (lowerVal.startsWith('y') || lowerVal.includes('yes') || lowerVal.includes('ok') || lowerVal.includes('confirm')) {
          executeCancel();
        } else {
          setDone(true);
          speakText("Cancellation aborted. Your appointment remains active.");
        }
      } else {
        if (lowerVal.startsWith('y') || lowerVal.includes('yes') || lowerVal.includes('ok') || lowerVal.includes('confirm')) {
          executeBooking();
        } else {
          setDone(true);
          speakText("Booking process cancelled.");
        }
      }
    }
  }

  // Instant Multi-Entity Booking Shortcut
  const handleInstantBookingShortcut = async (userText) => {
    const textLower = userText.toLowerCase();

    const matchedDoctor = doctors.find(d => 
      textLower.includes(d.name.toLowerCase()) || 
      textLower.includes(d.specialty.toLowerCase()) ||
      textLower.includes(d.name.split(' ')[1]?.toLowerCase() || '')
    ) || doctors[0];

    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    let dateStr = targetDate.toISOString().split('T')[0];

    if (textLower.includes('today')) {
      dateStr = new Date().toISOString().split('T')[0];
    } else if (textLower.includes('day after tomorrow')) {
      const d = new Date(); d.setDate(d.getDate() + 2);
      dateStr = d.toISOString().split('T')[0];
    }

    let timeStr = '10:00 AM';
    const timeMatch = textLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
    if (timeMatch) {
      timeStr = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3].toUpperCase()}`;
    }

    const newBooking = {
      patientName: currentUser?.name || 'Patient',
      patientEmail: currentUser?.email || 'patient@example.com',
      patientPhone: currentUser?.phone || import.meta.env.VITE_DEFAULT_PATIENT_PHONE || '+918591556205',
      doctorId: matchedDoctor.id,
      doctorName: matchedDoctor.name,
      specialty: matchedDoctor.specialty,
      hospital: matchedDoctor.hospital || 'Medi AI Clinic',
      date: dateStr,
      time: timeStr,
      appointmentType: 'Consultation',
      symptoms: 'Booked via AI Voice Agent Shortcut (Maya)',
      fee: matchedDoctor.fee || '$150'
    };

    try {
      const apt = await bookAppointment(newBooking);
      setDone(true);
      speakText(`Excellent! I have booked your appointment with Dr. ${matchedDoctor.name} for ${dateStr} at ${timeStr}. Confirmation details sent to your email.`, () => {
        endCall();
        if (apt?.id) navigate(`/confirmation/${apt.id}`);
      });
      toast.success("Appointment booked via Maya Voice Agent!");
    } catch (err) {
      speakText("I encountered a small error while booking. Let me retry that for you.");
    }
  };

  // Execution: Process New Booking
  async function executeBooking() {
    setDone(true);
    toast.loading("Booking appointment...", { id: 'voice-apt' });

    try {
      const apt = await bookAppointment({
        doctorId: ctx.doctor?.id || doctors[0].id,
        doctorEmail: ctx.doctor?.email || doctors[0].email,
        patientName: ctx.name || currentUser?.name || 'Patient',
        patientPhone: currentUser?.phone || import.meta.env.VITE_DEFAULT_PATIENT_PHONE || '+918591556205',
        age: parseInt(ctx.age) || 25,
        gender: ctx.gender || 'Other',
        symptoms: ctx.symptoms || 'Booked via Maya Voice Call',
        appointmentType: ctx.appointmentType || 'Consultation',
        date: ctx.date || new Date().toISOString().split('T')[0],
        time: ctx.time || '10:00 AM',
        fee: ctx.doctor?.fee || doctors[0].fee,
      });

      toast.success("Appointment confirmed! ✅", { id: 'voice-apt' });
      speakText(`Congratulations! Your appointment with Dr. ${ctx.doctor?.name || doctors[0].name} on ${ctx.date} at ${ctx.time} is confirmed. Directing you to confirmation.`, () => {
        endCall();
        if (apt?.id) navigate(`/confirmation/${apt.id}`);
      });
    } catch (e) {
      toast.error("Failed to book appointment", { id: 'voice-apt' });
      speakText("I encountered an issue completing your booking. Please try again.");
    }
  }

  // Execution: Process Reschedule
  async function executeReschedule() {
    setDone(true);
    toast.loading("Rescheduling appointment...", { id: 'voice-apt' });

    try {
      await rescheduleAppointment(selectedAptId, ctx.date, ctx.time);
      toast.success("Rescheduled successfully! 🔄", { id: 'voice-apt' });
      speakText(`Your appointment has been successfully rescheduled to ${ctx.date} at ${ctx.time}.`, () => {
        endCall();
        navigate('/appointments');
      });
    } catch (e) {
      toast.error("Failed to reschedule", { id: 'voice-apt' });
      speakText("Failed to reschedule your appointment.");
    }
  }

  // Execution: Process Cancel
  async function executeCancel() {
    setDone(true);
    toast.loading("Cancelling appointment...", { id: 'voice-apt' });

    try {
      await cancelAppointment(selectedAptId);
      toast.success("Appointment cancelled ❌", { id: 'voice-apt' });
      speakText("Your appointment has been cancelled successfully.", () => {
        endCall();
        navigate('/appointments');
      });
    } catch (e) {
      toast.error("Failed to cancel", { id: 'voice-apt' });
      speakText("Failed to cancel your appointment.");
    }
  }

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const dateOptions = getDateOptions();
  const genderOptions = ['Male', 'Female', 'Other'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            width: '100%', maxWidth: 520, maxHeight: '90vh',
            background: darkMode ? 'linear-gradient(145deg, #0f172a, #1e293b)' : 'white',
            borderRadius: 28, padding: 28,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            textAlign: 'center', position: 'relative', overflowY: 'auto',
            display: 'flex', flexDirection: 'column'
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(37,99,235,0.1)', color: '#2563eb', fontSize: 13, fontWeight: 700, margin: '0 auto 12px' }}>
            <Sparkles size={16} /> Medi AI Voice Calling Agent
          </div>

          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: darkMode ? 'white' : '#0f172a' }}>
            Maya — AI Voice Agent
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            {callActive ? `Active Call • ${formatTimer(callDuration)}` : 'Click to start live voice consultation'}
          </p>

          {/* Progress Dots Header */}
          {callActive && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: STEPS.indexOf(step) >= i ? '#2563eb' : (darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'),
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          )}

          {/* Voice Wave Visualizer Orb */}
          <div style={{ position: 'relative', height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            {isSpeaking && (
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, rgba(99,102,241,0) 70%)' }}
              />
            )}
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(5,150,105,0) 70%)' }}
              />
            )}
            <div 
              onClick={() => { if (callActive && !isSpeaking) startListening(); }}
              style={{
                width: 88, height: 88, borderRadius: '50%',
                background: isSpeaking ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : isListening ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #64748b, #475569)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                boxShadow: '0 10px 30px rgba(37,99,235,0.3)', cursor: 'pointer'
              }}>
              {isSpeaking ? <Volume2 size={38} /> : isListening ? <Mic size={38} /> : <Phone size={38} />}
            </div>
          </div>

          {/* Live Transcript / AI Speech */}
          {callActive && (
            <div style={{
              background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              borderRadius: 16, padding: 14, marginBottom: 16, textAlign: 'left', minHeight: 60, border: '1px solid rgba(148,163,184,0.15)'
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

          {/* Interactive Step-by-Step Quick Reply Chips & Cards */}
          {callActive && !done && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {step === 'mode' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { icon: '🗓', label: 'Book Appointment', action: 'I want to book an appointment', color: '#2563eb' },
                    { icon: '🔄', label: 'Reschedule', action: 'I want to reschedule my appointment', color: '#7c3aed' },
                    { icon: '❌', label: 'Cancel', action: 'I want to cancel my appointment', color: '#ef4444' },
                    { icon: '🔍', label: 'Check Slots', action: 'I want to check available slots', color: '#10b981' },
                  ].map(item => (
                    <motion.button key={item.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleVoiceInput(item.action)}
                      style={{
                        padding: '12px', borderRadius: 14, border: `1.5px solid ${item.color}40`,
                        background: darkMode ? `${item.color}15` : `${item.color}10`,
                        color: item.color, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}>
                      <span>{item.icon}</span> {item.label}
                    </motion.button>
                  ))}
                </div>
              )}

              {step === 'gender' && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {genderOptions.map(g => (
                    <button key={g} onClick={() => handleVoiceInput(g)} style={{
                      padding: '8px 16px', borderRadius: 16, border: '1.5px solid #2563eb',
                      background: 'transparent', color: '#2563eb', cursor: 'pointer', fontWeight: 700, fontSize: 13
                    }}>{g}</button>
                  ))}
                </div>
              )}

              {step === 'doctor' && mode === 'book' && ctx.candidates && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                  {ctx.candidates.map((doc, idx) => (
                    <div key={doc.id} onClick={() => handleVoiceInput(doc.name)} style={{
                      padding: '10px 14px', borderRadius: 14, border: '1px solid rgba(37,99,235,0.2)',
                      background: darkMode ? 'rgba(255,255,255,0.05)' : 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left'
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: doc.avatarColor || '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{doc.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: darkMode ? 'white' : '#0f172a' }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{doc.specialty} • ₹{doc.fee}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 'type' && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  {['Consultation', 'Check-up'].map(t => (
                    <button key={t} onClick={() => handleVoiceInput(t)} style={{
                      padding: '8px 16px', borderRadius: 16, border: '1.5px solid #7c3aed',
                      background: 'transparent', color: '#7c3aed', cursor: 'pointer', fontWeight: 700, fontSize: 13
                    }}>{t}</button>
                  ))}
                </div>
              )}

              {step === 'date' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {dateOptions.map(d => (
                    <button key={d} onClick={() => handleVoiceInput(d)} style={{
                      padding: '6px 12px', borderRadius: 14, border: '1.5px solid #10b981',
                      background: 'transparent', color: '#10b981', cursor: 'pointer', fontWeight: 700, fontSize: 12
                    }}>📅 {d}</button>
                  ))}
                </div>
              )}

              {step === 'slot' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {(availableSlots.length > 0 ? availableSlots : ['09:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '03:30 PM']).map(s => {
                    const isBooked = bookedSlots.includes(s);
                    return (
                      <button key={s} disabled={isBooked} onClick={() => handleVoiceInput(s)} style={{
                        padding: '6px 14px', borderRadius: 14,
                        border: isBooked ? '1px solid #cbd5e1' : '1.5px solid #7c3aed',
                        background: isBooked ? 'rgba(0,0,0,0.05)' : 'transparent',
                        color: isBooked ? '#94a3b8' : '#7c3aed',
                        cursor: isBooked ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12
                      }}>⏰ {s} {isBooked ? '(Booked)' : ''}</button>
                    );
                  })}
                </div>
              )}

              {step === 'confirm' && (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button onClick={() => handleVoiceInput('Yes')} style={{
                    padding: '10px 24px', borderRadius: 18, border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                    fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.4)'
                  }}>✅ Yes, Confirm</button>
                  <button onClick={() => handleVoiceInput('No')} style={{
                    padding: '10px 24px', borderRadius: 18, border: 'none',
                    background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                    fontWeight: 800, fontSize: 14, cursor: 'pointer'
                  }}>❌ Cancel</button>
                </div>
              )}
            </div>
          )}

          {/* Text Input Bar for Voice Modal */}
          {callActive && !done && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Or type your response here..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleVoiceInput(e.target.value.trim());
                    e.target.value = '';
                  }
                }}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 16,
                  border: darkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)',
                  background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                  color: darkMode ? 'white' : '#0f172a', fontSize: 13, outline: 'none'
                }}
              />
            </div>
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
