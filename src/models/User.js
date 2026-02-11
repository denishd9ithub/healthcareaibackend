const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    full_name: String,
    role: { type: String, default: 'user', enum: ['user', 'admin', 'doctor', 'superadmin'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
