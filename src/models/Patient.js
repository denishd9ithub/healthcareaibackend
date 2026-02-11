const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    full_name: { type: String, required: true },
    date_of_birth: Date,
    gender: String,
    phone: String,
    email: String,
    address: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
