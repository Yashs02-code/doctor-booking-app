/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EMAIL NOTIFICATION UTILITY — Medi AI (using Brevo via secure API route)
 *
 *  This file calls our own Vercel serverless function (/api/send-email),
 *  which calls Brevo on the server side — the Brevo API key is NEVER
 *  exposed in the browser bundle.
 *
 *  Setup required (one-time):
 *    1. Create a FREE Brevo account at https://app.brevo.com
 *    2. Go to Settings → SMTP & API → Generate API Key → copy it
 *    3. Add a verified sender email in Brevo → Senders & IPs → Senders
 *    4. Set these in Vercel → Settings → Environment Variables:
 *         BREVO_API_KEY       = your-brevo-api-key
 *         BREVO_SENDER_EMAIL  = the verified sender email (e.g. noreply@yourdomain.com)
 *         BREVO_SENDER_NAME   = Medi AI   (optional, defaults to "Medi AI")
 *    5. For local dev, add to .env.local:
 *         BREVO_API_KEY=...
 *         BREVO_SENDER_EMAIL=...
 *
 *  Note: These vars do NOT have the VITE_ prefix because they are server-side only.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Sends an instant booking confirmation email to the patient.
 * Calls the Vercel serverless function at /api/send-email.
 *
 * @param {Object} params
 * @param {string} params.toEmail         - Patient's registered email
 * @param {string} params.toName          - Patient's name
 * @param {string} params.doctorName      - Doctor's full name
 * @param {string} params.specialty       - Doctor's specialty
 * @param {string} params.date            - Appointment date (YYYY-MM-DD)
 * @param {string} params.time            - Appointment time (HH:MM)
 * @param {string} params.hospital        - Hospital / clinic name
 * @param {string} params.location        - City / location
 * @param {string} params.appointmentType - "Consultation" | "Check-up"
 * @param {string} params.symptoms        - Patient's symptoms
 * @param {string} params.bookingId       - Firestore booking document ID
 * @param {number|string} params.fee      - Consultation fee
 * @returns {Promise<boolean>}            - true on success, false on failure
 */
export async function sendBookingConfirmationEmail(params) {
  if (!params.toEmail) {
    console.warn('⚠️ No patient email — skipping confirmation email');
    return false;
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Email API error:', data.error || response.statusText);
      return false;
    }

    console.log('✅ Confirmation email sent to', params.toEmail, '| messageId:', data.messageId);
    return true;

  } catch (error) {
    console.error('❌ Failed to reach /api/send-email:', error.message);
    return false;
  }
}
