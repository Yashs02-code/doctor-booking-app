/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Vercel Serverless Function: /api/send-email
 *  Calls Brevo Transactional Email API (server-side — API key is NEVER exposed)
 *
 *  Required env vars (set in Vercel → Settings → Environment Variables):
 *    BREVO_API_KEY       — Your Brevo API key (keep secret, no VITE_ prefix)
 *    BREVO_SENDER_EMAIL  — Verified sender email in Brevo (e.g. noreply@yourdomain.com)
 *    BREVO_SENDER_NAME   — Display name (e.g. "Medi AI")
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Build a beautiful HTML confirmation email */
function buildEmailHTML({
  toName, doctorName, specialty, date, time,
  hospital, location, appointmentType, symptoms, bookingId, fee,
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Appointment Confirmed — Medi AI</title>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(37,99,235,0.15);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb 0%,#10b981 100%);padding:36px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:42px;height:42px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;">🏥</div>
        <span style="font-size:26px;font-weight:900;color:white;letter-spacing:-0.5px;">Medi AI</span>
      </div>
      <div style="background:rgba(255,255,255,0.2);display:inline-block;padding:6px 18px;border-radius:20px;margin-top:4px;">
        <span style="color:white;font-size:13px;font-weight:700;letter-spacing:1px;">✅ APPOINTMENT CONFIRMED</span>
      </div>
    </div>

    <!-- Body -->
    <div style="background:white;padding:36px 32px;">
      <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">Hi ${toName}! 👋</p>
      <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
        Your appointment has been successfully booked through Medi AI. Here are your full details:
      </p>

      <!-- Appointment Card -->
      <div style="background:#f8fafc;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #e2e8f0;">
        <!-- Doctor Row -->
        <div style="display:flex;align-items:center;gap:14px;padding-bottom:18px;border-bottom:1px solid #e2e8f0;margin-bottom:18px;">
          <div style="width:52px;height:52px;background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:14px;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:900;flex-shrink:0;">
            👨‍⚕️
          </div>
          <div>
            <div style="font-size:17px;font-weight:800;color:#0f172a;">${doctorName}</div>
            <div style="font-size:13px;color:#64748b;margin-top:2px;">${specialty}</div>
          </div>
        </div>

        <!-- Details Grid -->
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:38%;vertical-align:top;">📅 Date</td>
            <td style="padding:8px 0;font-weight:700;color:#2563eb;font-size:15px;">${date}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">🕐 Time</td>
            <td style="padding:8px 0;font-weight:700;color:#2563eb;font-size:15px;">${time}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">🏨 Venue</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${hospital}, ${location}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">📋 Type</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;">${appointmentType || 'Consultation'}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">🩺 Symptoms</td>
            <td style="padding:8px 0;color:#475569;font-size:14px;">${symptoms || 'General check-up'}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;">💰 Fee</td>
            <td style="padding:8px 0;font-weight:700;color:#10b981;font-size:15px;">${fee || 'As discussed'}</td>
          </tr>
        </table>
      </div>

      <!-- Booking ID Badge -->
      <div style="background:linear-gradient(135deg,rgba(37,99,235,0.06),rgba(16,185,129,0.06));border:1.5px dashed #2563eb;border-radius:14px;padding:16px 20px;margin-bottom:24px;text-align:center;">
        <div style="font-size:11px;color:#2563eb;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Booking Reference</div>
        <div style="font-size:22px;font-weight:900;letter-spacing:3px;color:#2563eb;">${bookingId}</div>
      </div>

      <!-- Reminder Notice -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <div style="font-weight:700;color:#166534;margin-bottom:8px;font-size:14px;">📅 Set Up Reminders</div>
        <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;">
          On your confirmation page, download the <strong>.ics calendar file</strong> to add this appointment to Google Calendar, Apple Calendar, or Outlook — with automatic email reminders set for <strong>24 hours before</strong> and <strong>1 hour before</strong> your visit.
        </p>
      </div>

      <!-- What to Bring -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:18px 20px;">
        <div style="font-weight:700;color:#92400e;margin-bottom:8px;font-size:14px;">🗒️ What to Bring</div>
        <ul style="margin:0;padding-left:18px;color:#78350f;font-size:13px;line-height:2;">
          <li>Government photo ID</li>
          <li>Previous prescriptions (if any)</li>
          <li>Insurance documents (if applicable)</li>
          <li>Arrive 10 minutes early</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#0f172a;padding:24px 32px;text-align:center;">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.9);font-weight:700;font-size:14px;">Medi AI — AI-Powered Healthcare Scheduling</p>
      <p style="margin:0;color:#64748b;font-size:12px;">This is an automated confirmation. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

/** Vercel Serverless Handler */
export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Environment check ---
  const BREVO_API_KEY      = process.env.BREVO_API_KEY;
  const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
  const BREVO_SENDER_NAME  = process.env.BREVO_SENDER_NAME || 'Medi AI';

  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    console.error('Missing BREVO_API_KEY or BREVO_SENDER_EMAIL in environment variables');
    return res.status(500).json({ error: 'Email service not configured on server.' });
  }

  // --- Extract body ---
  const {
    toEmail, toName, doctorName, specialty,
    date, time, hospital, location,
    appointmentType, symptoms, bookingId, fee,
  } = req.body || {};

  if (!toEmail) {
    return res.status(400).json({ error: 'toEmail is required' });
  }

  // --- Format date/time nicely ---
  const formattedDate = (() => {
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return date; }
  })();

  const formattedTime = (() => {
    try {
      const [h, m] = time.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12  = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch { return time; }
  })();

  const shortId = (bookingId || '').slice(-8).toUpperCase();
  const feeStr  = fee ? `₹${fee}` : 'As discussed';

  // --- Build email HTML ---
  const htmlContent = buildEmailHTML({
    toName: toName || 'Patient',
    doctorName, specialty,
    date: formattedDate, time: formattedTime,
    hospital, location, appointmentType,
    symptoms, bookingId: shortId, fee: feeStr,
  });

  // --- Call Brevo API ---
  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept':       'application/json',
        'Content-Type': 'application/json',
        'api-key':      BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to:     [{ email: toEmail, name: toName || 'Patient' }],
        subject: `✅ Appointment Confirmed — ${doctorName} on ${formattedDate}`,
        htmlContent,
        tags: ['appointment-confirmation', 'medi-ai'],
      }),
    });

    const brevoData = await brevoRes.json();

    if (!brevoRes.ok) {
      console.error('Brevo API error:', brevoData);
      return res.status(502).json({ error: 'Failed to send email via Brevo', details: brevoData });
    }

    console.log(`✅ Brevo email sent to ${toEmail} | messageId: ${brevoData.messageId}`);
    return res.status(200).json({ success: true, messageId: brevoData.messageId });

  } catch (err) {
    console.error('Brevo fetch error:', err);
    return res.status(500).json({ error: 'Internal server error while sending email' });
  }
}
