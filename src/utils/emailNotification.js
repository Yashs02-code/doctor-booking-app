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
function buildEmailHTML({
  toName, doctorName, specialty, date, time,
  hospital, location, appointmentType, symptoms, bookingId, fee,
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2563eb, #10b981); color: white; padding: 30px; text-align: center;">
        <h2 style="margin: 0;">Appointment Confirmed! ✅</h2>
        <p style="opacity: 0.9;">Booking Reference: ${bookingId}</p>
      </div>
      <div style="padding: 30px; color: #333;">
        <p>Hi ${toName},</p>
        <p>Your appointment has been successfully booked via <strong>Medi AI</strong>.</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2563eb;">${doctorName}</h3>
          <p style="margin: 5px 0;"><strong>Specialty:</strong> ${specialty}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
          <p style="margin: 5px 0;"><strong>Venue:</strong> ${hospital}, ${location}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${appointmentType || 'Consultation'}</p>
          <p style="margin: 5px 0;"><strong>Fee:</strong> ${fee || 'As discussed'}</p>
        </div>
        <p>Reminders have been set for 24 hours and 1 hour before your visit.</p>
      </div>
      <div style="background: #0f172a; color: #cbd5e1; padding: 20px; text-align: center; font-size: 12px;">
        &copy; 2026 Medi AI Clinic | Autonomous Healthcare Systems
      </div>
    </div>
  `;
}

/**
 * Sends an instant booking confirmation email to the patient.
 * 1. Tries the /api/send-email relay (Vercel Production)
 * 2. Falls back to direct Brevo API call if on localhost (npm run dev)
 */
export async function sendBookingConfirmationEmail(params) {
  if (!params.toEmail) {
    console.warn('⚠️ No patient email — skipping confirmation email');
    return false;
  }

  try {
    // Attempt 1: Serverless Relay (Recommended for Production)
    const relayRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (relayRes.ok) {
      const data = await relayRes.json();
      console.log('✅ Confirmation email sent via Relay | messageId:', data.messageId);
      return true;
    }

    // Attempt 2: Direct Fallback (Local Development fallback for npm run dev)
    const BREVO_KEY = import.meta.env.VITE_BREVO_API_KEY;
    const BREVO_SENDER = import.meta.env.VITE_BREVO_SENDER_EMAIL;

    if (!BREVO_KEY || !BREVO_SENDER) {
      console.error('❌ Email relay failed and no direct VITE_ keys found in .env');
      return false;
    }

    console.info('📡 Relay failed (expected in local dev). Attempting direct Brevo call...');
    
    const body = {
      sender: { name: import.meta.env.VITE_BREVO_SENDER_NAME || 'Medi AI', email: BREVO_SENDER },
      to: [{ email: params.toEmail, name: params.toName || 'Patient' }],
      subject: `✅ Appointment Confirmed — ${params.doctorName}`,
      htmlContent: buildEmailHTML({
        ...params,
        bookingId: (params.bookingId || '').slice(-8).toUpperCase()
      })
    };

    const directRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_KEY
      },
      body: JSON.stringify(body)
    });

    if (directRes.ok) {
      console.log('✅ Instant confirmation email sent DIRECTLY to', params.toEmail);
      toast.success('Instant confirmation email sent! 📧');
      return true;
    } else {
      const err = await directRes.json();
      console.error('❌ Direct Brevo call failed:', err);
      return false;
    }

  } catch (error) {
    console.error('❌ Critical failure in email service:', error.message);
    return false;
  }
}
