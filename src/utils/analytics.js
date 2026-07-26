/**
 * analytics.js — Centralized Firebase Analytics event tracking
 *
 * Usage anywhere in the app:
 *   import { trackEvent, trackPageView, trackAppointmentBooked } from '../utils/analytics';
 *
 *   trackEvent('button_clicked', { button_name: 'Book Now' });
 *   trackAppointmentBooked({ doctorName: 'Dr. Smith', specialty: 'Cardiology' });
 */

import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';

/**
 * Internal helper — resolves the analytics instance then fires the event.
 * If analytics is null (blocked by ad-blocker / unsupported env), it silently no-ops.
 */
async function fire(eventName, params = {}) {
  try {
    const instance = await analytics;
    if (instance) {
      logEvent(instance, eventName, {
        ...params,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    // Never crash the app because of analytics
    console.warn('[Analytics] Failed to log event:', eventName, err);
  }
}

// ─────────────────────────────────────────────────────────────
// PAGE VIEW TRACKING
// Called automatically in App.jsx on every route change
// ─────────────────────────────────────────────────────────────

/** Track a page/screen view */
export function trackPageView(pageName, pageLocation = window.location.href) {
  fire('page_view', {
    page_title: pageName,
    page_location: pageLocation,
    page_path: window.location.pathname,
  });
}

// ─────────────────────────────────────────────────────────────
// USER EVENTS
// ─────────────────────────────────────────────────────────────

/** User signed up for the first time */
export function trackSignUp(method = 'google') {
  fire('sign_up', { method });
}

/** User logged in */
export function trackLogin(method = 'google', role = 'patient') {
  fire('login', { method, user_role: role });
}

/** User logged out */
export function trackLogout() {
  fire('logout', {});
}

// ─────────────────────────────────────────────────────────────
// APPOINTMENT EVENTS
// ─────────────────────────────────────────────────────────────

/** Appointment successfully booked */
export function trackAppointmentBooked({ doctorName, specialty, appointmentType, fee }) {
  fire('appointment_booked', {
    doctor_name: doctorName,
    specialty,
    appointment_type: appointmentType || 'consultation',
    fee: fee || 0,
    currency: 'INR',
  });
}

/** User viewed a doctor's profile or detail page */
export function trackDoctorViewed({ doctorName, specialty }) {
  fire('doctor_viewed', { doctor_name: doctorName, specialty });
}

/** User cancelled an appointment */
export function trackAppointmentCancelled({ doctorName, reason }) {
  fire('appointment_cancelled', { doctor_name: doctorName, reason: reason || 'not_specified' });
}

// ─────────────────────────────────────────────────────────────
// AI CHAT EVENTS
// ─────────────────────────────────────────────────────────────

/** User sent a message to the AI assistant */
export function trackAIChatMessage({ messageLength, hasSymptoms }) {
  fire('ai_chat_message', {
    message_length: messageLength,
    has_symptoms: hasSymptoms,
  });
}

/** AI recommended a doctor */
export function trackAIRecommendation({ specialty, confidence }) {
  fire('ai_recommendation', { specialty, confidence: confidence || 'high' });
}

// ─────────────────────────────────────────────────────────────
// EMAIL EVENTS
// ─────────────────────────────────────────────────────────────

/** Confirmation email sent successfully */
export function trackEmailSent({ success }) {
  fire('email_sent', { success });
}

// ─────────────────────────────────────────────────────────────
// QR CODE EVENTS
// ─────────────────────────────────────────────────────────────

/** User downloaded/viewed QR code */
export function trackQRGenerated({ bookingId }) {
  fire('qr_generated', { booking_id: bookingId });
}

// ─────────────────────────────────────────────────────────────
// GENERIC CUSTOM EVENT
// Use this for anything not covered above
// ─────────────────────────────────────────────────────────────

/** Fire any custom event with any parameters */
export function trackEvent(eventName, params = {}) {
  fire(eventName, params);
}
