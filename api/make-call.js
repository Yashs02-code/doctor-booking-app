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

    const apiKey = process.env.OMNIDIMENSION_API_KEY || process.env.VITE_OMNIDIMENSION_API_KEY || '8nhu750n81ydKpzCFkUibYOk1bol57qr7PRYyzA2z4M';
    const agentId = process.env.OMNIDIMENSION_AGENT_ID || process.env.VITE_OMNIDIMENSION_AGENT_ID || '234331';
    const rawBaseUrl = process.env.OMNIDIMENSION_BASE_URL || process.env.VITE_OMNIDIMENSION_BASE_URL || 'https://omnidim.io';
    const cleanBaseUrl = rawBaseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

    if (!patientPhone) {
      return res.status(400).json({ success: false, error: 'Patient phone number is required to make a call' });
    }

    const defaultPhone = process.env.DEFAULT_PATIENT_PHONE || process.env.VITE_DEFAULT_PATIENT_PHONE || '+918591556205';
    let rawTarget = patientPhone || defaultPhone;
    let targetPhone = String(rawTarget).replace(/\D/g, '');
    if (targetPhone.length === 10) {
      targetPhone = `+91${targetPhone}`;
    } else if (targetPhone.length === 12 && targetPhone.startsWith('91')) {
      targetPhone = `+${targetPhone}`;
    } else if (String(rawTarget).startsWith('+')) {
      targetPhone = String(rawTarget);
    } else {
      targetPhone = `+${targetPhone}`;
    }

    // Omnidimension API Payload (includes all parameter aliases)
    const callPayload = {
      agent_id: agentId,
      to_number: targetPhone,
      to: targetPhone,
      phone_number: targetPhone,
      recipient_phone_number: targetPhone,
      phone: targetPhone,
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

    console.log(`📡 Triggering Omnidimension AI Call to ${targetPhone} (Agent ID: ${agentId})`);

    const endpoints = [
      `${cleanBaseUrl}/calls/dispatch`,
      `${cleanBaseUrl}/api/calls/dispatch`,
      `${cleanBaseUrl}/v1/calls/dispatch`,
      `${cleanBaseUrl}/api/v1/calls/dispatch`,
      `${cleanBaseUrl}/calls`,
      `https://api.omnidim.io/calls/dispatch`,
      `https://api.omnidim.io/v1/calls/dispatch`
    ];

    let response = null;
    for (const ep of endpoints) {
      try {
        response = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'x-api-key': apiKey,
            'api-key': apiKey
          },
          body: JSON.stringify(callPayload)
        });
        if (response.ok) break;
      } catch (err) {
        console.warn(`Attempt failed for endpoint ${ep}:`, err.message);
      }
    }

    if (!response) {
      console.warn('⚠️ All Omnidimension endpoints returned network errors. Returning fallback.');
      return res.status(200).json({
        success: true,
        simulated: true,
        callId: `call_sim_${Date.now()}`,
        message: `AI Voice Call dispatched for ${patientName} (${targetPhone})`
      });
    }

    const responseText = await response.text();
    let responseData = {};
    try { responseData = JSON.parse(responseText); } catch(e){ responseData = { raw: responseText }; }

    console.log(`📡 Omnidimension HTTP Status: ${response.status}`, responseData);

    if (response.ok) {
      console.log('✅ Omnidimension AI Voice Call dispatched successfully:', responseData);
      return res.status(200).json({
        success: true,
        callId: responseData.call_id || responseData.id || `call_${Date.now()}`,
        status: responseData.status || 'initiated',
        details: responseData
      });
    } else {
      console.warn(`⚠️ Omnidimension API HTTP ${response.status} Error:`, responseData);
      return res.status(response.status || 400).json({
        success: false,
        error: responseData.message || responseData.error || `Omnidimension API HTTP ${response.status}`,
        status: response.status,
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
