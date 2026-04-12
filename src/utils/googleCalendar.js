/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  GOOGLE CALENDAR REST API UTILITY — Medi AI
 *
 *  Uses the patient's Google OAuth access token (obtained during Google Sign-In)
 *  to directly create an event in their Google Calendar via the REST API.
 *
 *  The event includes:
 *    • Email reminder  → 24 hours (1440 min) before appointment
 *    • Email reminder  → 1 hour (60 min) before appointment
 *    • Popup reminder  → 1 hour before
 *    • Popup reminder  → 15 minutes before
 *
 *  Google Calendar then emails the patient at those exact times automatically.
 *
 *  IMPORTANT — One-time Google Cloud setup required (see bottom of this file):
 *    1. Enable Google Calendar API in Google Cloud Console
 *    2. Add calendar.events scope to OAuth consent screen
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const TIMEZONE     = 'Asia/Kolkata';

/**
 * Saves the Google OAuth access token to sessionStorage with its expiry.
 * Call this immediately after a successful Google Sign-In.
 *
 * @param {string} accessToken - The OAuth access token from GoogleAuthProvider.credentialFromResult()
 */
export function saveGoogleAccessToken(accessToken) {
  if (!accessToken) return;
  const expiresAt = Date.now() + 55 * 60 * 1000; // 55-min safety margin (token lasts 60 min)
  sessionStorage.setItem('medi_g_token', accessToken);
  sessionStorage.setItem('medi_g_token_exp', expiresAt.toString());
  console.log('✅ Google Calendar access token saved (expires in ~55 min)');
}

/**
 * Retrieves the stored Google access token if it's still valid.
 * @returns {string|null} The access token, or null if expired/missing.
 */
export function getStoredGoogleToken() {
  const token   = sessionStorage.getItem('medi_g_token');
  const expiry  = parseInt(sessionStorage.getItem('medi_g_token_exp') || '0', 10);
  if (!token || Date.now() >= expiry) return null;
  return token;
}

/**
 * Clears the stored Google access token (call on logout).
 */
export function clearGoogleToken() {
  sessionStorage.removeItem('medi_g_token');
  sessionStorage.removeItem('medi_g_token_exp');
}

/**
 * Formats "2026-04-15" + "10:30" → "2026-04-15T10:30:00"
 */
function buildDateTimeString(date, time) {
  const [year, month, day] = (date || '').split('-');
  const [hour, minute]     = (time || '09:00').split(':').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}-${month}-${day}T${pad(hour)}:${pad(minute)}:00`;
}

/**
 * Adds 1 hour to a datetime string "2026-04-15T10:30:00" → "2026-04-15T11:30:00"
 */
function addOneHour(dtStr) {
  const d = new Date(dtStr);
  d.setHours(d.getHours() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

/**
 * Creates an appointment event directly in the patient's Google Calendar
 * with automatic email reminders at 24h and 1h before.
 *
 * @param {Object} appointment - Appointment data from Firestore
 * @param {Object} doctor      - Doctor data object
 * @param {string} accessToken - Google OAuth access token (from Google Sign-In)
 * @returns {Promise<Object|null>} Created event object or null on failure
 */
export async function createGoogleCalendarEvent(appointment, doctor, accessToken) {
  if (!accessToken) {
    console.warn('⚠️ No Google access token — skipping Google Calendar sync');
    return null;
  }

  const { date, time, patientName, appointmentType, symptoms, id } = appointment;
  const { name: doctorName, specialty, hospital, location, fee } = doctor;

  const startDT = buildDateTimeString(date, time);
  const endDT   = addOneHour(startDT);

  const eventBody = {
    summary:  `🏥 Medical Appointment – ${doctorName}`,
    location: `${hospital}, ${location}`,
    description: [
      `MEDI AI — APPOINTMENT CONFIRMATION`,
      ``,
      `👤 Patient      : ${patientName}`,
      `👨‍⚕️ Doctor       : ${doctorName} (${specialty})`,
      `📋 Type         : ${appointmentType || 'Consultation'}`,
      `🩺 Symptoms     : ${symptoms || 'General check-up'}`,
      `💰 Fee          : ${fee ? '₹' + fee : 'As discussed'}`,
      ``,
      `🆔 Booking ID   : ${(id || '').slice(-8).toUpperCase()}`,
      ``,
      `Booked via Medi AI ✅`,
    ].join('\n'),
    start: { dateTime: startDT, timeZone: TIMEZONE },
    end:   { dateTime: endDT,   timeZone: TIMEZONE },
    colorId: '9',  // Blueberry (Google Calendar color)
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },  // 📧 24 hours before
        { method: 'email', minutes: 60 },        // 📧 1 hour before
        { method: 'popup', minutes: 60 },        // 🔔 1 hour popup
        { method: 'popup', minutes: 15 },        // 🔔 15-min popup
      ],
    },
  };

  try {
    const response = await fetch(CALENDAR_API, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!response.ok) {
      const errData = await response.json();
      const errMsg  = errData?.error?.message || response.statusText;
      console.error('❌ Google Calendar API error:', errMsg, '| Status:', response.status);

      // 401 = token expired, 403 = insufficient scope
      if (response.status === 401) {
        clearGoogleToken();
        console.warn('Google access token expired — cleared from storage');
      }
      return null;
    }

    const created = await response.json();
    console.log('✅ Google Calendar event created:', created.htmlLink);
    return created;

  } catch (err) {
    console.error('❌ Google Calendar fetch failed:', err.message);
    return null;
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  GOOGLE CLOUD CONSOLE — Required One-Time Setup
 * ─────────────────────────────────────────────────────────────────────────────
 *  1. Go to: https://console.cloud.google.com
 *  2. Select your Firebase project → APIs & Services → Library
 *  3. Search "Google Calendar API" → Enable it
 *  4. Go to: APIs & Services → OAuth consent screen
 *  5. Click "Add or Remove Scopes"
 *  6. Add: https://www.googleapis.com/auth/calendar.events
 *  7. Save → Submit for verification (or keep in Testing mode for up to 100 users)
 *
 *  ⚠️ Until verified, only "Test Users" listed in OAuth consent can use Calendar sync.
 *  Add test Gmail accounts in: APIs & Services → OAuth consent screen → Test Users
 * ─────────────────────────────────────────────────────────────────────────────
 */
