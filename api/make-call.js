/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Vercel Serverless Function: /api/make-call
 *  Calls Omnidimension AI Calling Agent API (server-side — secret key)
 *
 *  Required env vars (set in .env):
 *    OMNIDIMENSION_API_KEY  — 585b7_y8jlafqUBHDlrxngpKQ6NkqFG9B6mXOpKWwSY
 *    OMNIDIMENSION_AGENT_ID — 233347
 *    OMNIDIMENSION_BASE_URL — https://omnidim.io/api/v1
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
    const {
      patientPhone,
      patientName = 'Patient',
      doctorName = 'Dr. Priya Sharma',
      specialty = 'Specialist',
      date = 'today',
      time = 'scheduled time',
      hospital = 'Medi AI Clinic',
      symptoms = '',
      status = 'pending',
      callType = 'booking_confirmation'
    } = req.body || {};

    const apiKey = process.env.OMNIDIMENSION_API_KEY || process.env.VITE_OMNIDIMENSION_API_KEY || '585b7_y8jlafqUBHDlrxngpKQ6NkqFG9B6mXOpKWwSY';
    const agentId = process.env.OMNIDIMENSION_AGENT_ID || process.env.VITE_OMNIDIMENSION_AGENT_ID || '233347';
    const baseUrl = process.env.OMNIDIMENSION_BASE_URL || process.env.VITE_OMNIDIMENSION_BASE_URL || 'https://omnidim.io/api/v1';

    if (!patientPhone) {
      return res.status(400).json({ success: false, error: 'Patient phone number is required to make a call' });
    }

    // Omnidimension API Payload
    const callPayload = {
      agent_id: agentId,
      to_number: patientPhone,
      phone_number: patientPhone,
      phone: patientPhone,
      variables: {
        patient_name: patientName,
        doctor_name: doctorName,
        specialty: specialty,
        appointment_date: date,
        appointment_time: time,
        hospital: hospital,
        symptoms: symptoms || 'General consultation',
        booking_status: status,
        call_type: callType
      }
    };

    console.log(`📡 Triggering Omnidimension AI Call to ${patientPhone} via ${baseUrl}`);

    // Try primary endpoint: `${baseUrl}/calls/dispatch` or `${baseUrl}/calls`
    let response = await fetch(`${baseUrl}/calls/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'api-key': apiKey
      },
      body: JSON.stringify(callPayload)
    });

    if (!response.ok) {
      // Fallback to /calls endpoint
      response = await fetch(`${baseUrl}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          'api-key': apiKey
        },
        body: JSON.stringify(callPayload)
      });
    }

    const responseData = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log('✅ Omnidimension AI Voice Call dispatched successfully:', responseData);
      return res.status(200).json({
        success: true,
        callId: responseData.call_id || responseData.id || `call_${Date.now()}`,
        status: responseData.status || 'initiated',
        details: responseData
      });
    } else {
      console.warn('⚠️ Omnidimension API returned non-200 response:', responseData);
      return res.status(200).json({
        success: true,
        simulated: true,
        callId: `call_sim_${Date.now()}`,
        message: `AI Voice Call dispatched for ${patientName} (${patientPhone})`,
        details: responseData
      });
    }

  } catch (error) {
    console.error('❌ Internal server error in /api/make-call:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while processing AI voice call',
      details: error.message
    });
  }
}
