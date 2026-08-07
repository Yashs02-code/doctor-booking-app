import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  patientEmail: { type: String, default: '' },
  patientPhone: { type: String, default: '' },
  age: { type: Number },
  gender: { type: String, default: '' },
  doctorId: { type: String, required: true },
  doctorName: { type: String, default: '' },
  doctorEmail: { type: String, default: '' },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  time: { type: String, required: true }, // Format: HH:MM
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'cancelled'], 
    default: 'confirmed' 
  },
  appointmentType: { type: String, default: 'Consultation' },
  symptoms: { type: String, default: '' },
  fee: { type: Number },
  bookedAt: { type: Date, default: Date.now }
});

// Avoid compiling the model multiple times in serverless environments
export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);