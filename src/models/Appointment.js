const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    scheduled_at: { type: Date, required: true },
    status: { type: String, default: 'scheduled', enum: ['scheduled', 'completed', 'cancelled', 'no_show'] },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
