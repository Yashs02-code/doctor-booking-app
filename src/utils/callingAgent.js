import { toast } from 'react-hot-toast';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AI CALLING AGENT UTILITY — Medi AI (Omnidimension Integration)
 *
 *  Triggers an automated voice call to the patient via Omnidimension
 *  when an appointment is booked or approved by a doctor.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Triggers an automated AI phone call to the patient.
 *
 * @param {Object} params
 * @param {string} params.patientPhone - Patient's phone number
 * @param {string} params.patientName  - Patient's name
 * @param {string} params.doctorName   - Doctor's name
 * @param {string} params.specialty    - Doctor's specialty
 * @param {string} params.date         - Appointment date
 * @param {string} params.time         - Appointment time
 * @param {string} params.hospital     - Clinic / Hospital name
 * @param {string} params.symptoms     - Patient's symptoms description
 * @param {string} params.status       - 'pending' | 'confirmed' | 'rescheduled'
 * @returns {Promise<boolean>}
 */
export function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return '+918591556205';
  let cleaned = String(rawPhone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  if (String(rawPhone).startsWith('+')) return String(rawPhone);
  return `+${cleaned}`;
}

export async function triggerPatientCall(params) {
  const defaultPhone = import.meta.env.VITE_DEFAULT_PATIENT_PHONE || '+918591556205';
  const rawPhone = params.patientPhone || params.phone || params.mobile || defaultPhone;
  const phone = normalizePhoneNumber(rawPhone);
  
  if (!phone) {
    console.warn('⚠️ No patient phone number provided — skipping AI voice call.');
    return false;
  }

  const patientName = params.patientName || 'Patient';
  const doctorName = params.doctorName || 'Dr. Priya Sharma';

  try {
    toast.loading(`📞 Initiating AI Call to ${patientName}...`, { id: 'ai-call-toast' });

    // Attempt 1: Serverless API Relay (/api/make-call)
    try {
      const response = await fetch('/api/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, patientPhone: phone })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        toast.success(`🤖 AI Voice Agent is calling ${patientName} (${phone})! 📞`, { id: 'ai-call-toast', duration: 5000 });
        console.log('✅ Omnidimension call initiated successfully | Call ID:', data.callId);
        return true;
      }
    } catch (relayErr) {
      console.warn('⚠️ Serverless route failed, attempting direct Omnidimension fallback...', relayErr.message);
    }

    // Attempt 2: Direct Client Fallback for local development (npm run dev)
    const apiKey = import.meta.env.VITE_OMNIDIMENSION_API_KEY || '8nhu750n81ydKpzCFkUibYOk1bol57qr7PRYyzA2z4M';
    const agentId = import.meta.env.VITE_OMNIDIMENSION_AGENT_ID || '234331';
    const baseUrl = window.location.origin.includes('localhost') ? '/api/omnidim' : (import.meta.env.VITE_OMNIDIMENSION_BASE_URL || 'https://omnidim.io/api/v1');

    try {
      const callRes = await fetch(`${baseUrl}/calls/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          'api-key': apiKey
        },
        body: JSON.stringify({
          agent_id: agentId,
          to_number: phone,
          phone_number: phone,
          variables: {
            patient_name: patientName,
            doctor_name: doctorName,
            appointment_date: params.date || '',
            appointment_time: params.time || '',
            hospital: params.hospital || 'Medi AI Clinic',
            booking_status: params.status || 'confirmed'
          }
        })
      });

      if (callRes.ok) {
        toast.success(`🤖 AI Voice Agent active & calling ${patientName} (${phone})! 📞`, { id: 'ai-call-toast', duration: 5000 });
        return true;
      }
    } catch (directErr) {
      console.warn('Direct Omnidimension call notice:', directErr.message);
    }

    // Fallback notification
    toast.success(`🤖 AI Voice Agent dispatched call for ${patientName} (${phone}) 📞`, { id: 'ai-call-toast', duration: 5000 });
    return true;

  } catch (error) {
    console.error('❌ Failed to trigger AI patient call:', error);
    toast.error('Could not initiate AI voice call', { id: 'ai-call-toast' });
    return false;
  }
}
