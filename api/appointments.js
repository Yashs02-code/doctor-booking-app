import connectDB from './utils/db.js';
import Appointment from './models/Appointment.js';

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // 1. GET ALL APPOINTMENTS
    if (req.method === 'GET') {
      const appointments = await Appointment.find().sort({ bookedAt: -1 });
      return res.status(200).json(appointments);
    }

    // 2. CREATE A NEW APPOINTMENT (BOOKING)
    if (req.method === 'POST') {
      const newApt = new Appointment(req.body);
      const savedApt = await newApt.save();
      return res.status(201).json(savedApt);
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}