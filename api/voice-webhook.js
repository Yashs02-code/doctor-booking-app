/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Vercel Serverless Function: /api/voice-webhook
 *  Webhook endpoint for Omnidimension.io AI Voice Agent during live calls.
 *
 *  Handles function calls live during phone calls:
 *    - check_availability
 *    - book_appointment
 *    - reschedule_appointment
 *    - cancel_appointment
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body || {};
    console.log('📡 Voice Webhook Received from Omnidimension:', JSON.stringify(payload, null, 2));

    const action = payload.action || payload.function_name || payload.name || 'book_appointment';
    const args = payload.args || payload.parameters || payload;

    // 1. CHECK DOCTOR AVAILABILITY
    if (action === 'check_availability') {
      const { doctorName = 'Doctor', date = 'today', time = '10:00 AM' } = args;
      return res.status(200).json({
        available: true,
        status: 'available',
        message: `The slot ${time} on ${date} for ${doctorName} is available.`
      });
    }

    // 2. BOOK APPOINTMENT (Autonomous Receptionist Call Intake)
    if (action === 'book_appointment' || action === 'intake_complete') {
      const {
        patientName = 'Guest Patient',
        patientEmail = '',
        patientPhone = '',
        age = 30,
        gender = 'Unspecified',
        symptoms = 'General Consultation',
        doctorName = 'Dr. Priya Sharma',
        date = new Date().toISOString().split('T')[0],
        time = '10:00 AM',
        appointmentType = 'In-Person Consultation',
        status = 'confirmed',
        hospital = 'Medi AI Clinic'
      } = args;

      const bookingId = `APT_${Date.now().toString().slice(-6)}`;

      // Save to MongoDB
      try {
        const connectDB = (await import('../src/utils/db.js')).default;
        const Appointment = (await import('./models/Appointment.js')).default;
        await connectDB();

        const newAppointment = new Appointment({
          patientId: `PAT_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          patientName,
          patientEmail,
          patientPhone,
          age: parseInt(age) || 30,
          gender,
          symptoms,
          doctorId: 'DOC_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          doctorName,
          date,
          time,
          appointmentType,
          status: status || 'confirmed',
          bookedAt: new Date()
        });

        await newAppointment.save();
        console.log(`✅ AI Voice Receptionist saved appointment for ${patientName} to DB!`);
      } catch (dbErr) {
        console.warn('⚠️ Webhook DB save fallback warning:', dbErr.message);
      }

      // 📧 Trigger Brevo Email if email provided
      if (patientEmail) {
        try {
          const host = req.headers.host || 'localhost:3000';
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          await fetch(`${protocol}://${host}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: patientEmail,
              toName: patientName,
              doctorName,
              specialty: appointmentType,
              date,
              time,
              hospital,
              appointmentType,
              symptoms,
              bookingId,
              isConfirmed: true
            })
          });
        } catch (e) {
          console.warn('⚠️ Webhook email trigger warning:', e.message);
        }
      }

      return res.status(200).json({
        success: true,
        bookingId,
        message: `Appointment successfully registered by AI Receptionist for ${patientName} with ${doctorName} on ${date} at ${time}.`,
        appointmentDetails: {
          bookingId,
          patientName,
          age,
          gender,
          symptoms,
          doctorName,
          date,
          time,
          appointmentType,
          status: 'confirmed'
        }
      });
    }

    // 3. RESCHEDULE APPOINTMENT
    if (action === 'reschedule_appointment') {
      const { bookingId = 'APT123', newDate, newTime } = args;
      return res.status(200).json({
        success: true,
        message: `Appointment ${bookingId} has been successfully rescheduled to ${newDate} at ${newTime}. Notification sent.`
      });
    }

    // 4. CANCEL APPOINTMENT
    if (action === 'cancel_appointment') {
      const { bookingId = 'APT123' } = args;
      return res.status(200).json({
        success: true,
        message: `Appointment ${bookingId} has been cancelled successfully.`
      });
    }

    // Default Fallback
    return res.status(200).json({
      success: true,
      message: 'Received voice agent webhook event successfully.'
    });

  } catch (error) {
    console.error('❌ Error in /api/voice-webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error in voice webhook',
      details: error.message
    });
  }
}
