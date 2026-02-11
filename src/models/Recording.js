const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema(
  {
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    original_filename: { type: String, required: true },
    file_path: { type: String, required: true },
    raw_transcript: { type: mongoose.Schema.Types.Mixed },
    utterances: [{ speaker: Number, transcript: String, start: Number, end: Number }],
    transcript_by_speaker: [{
      speaker_index: Number,
      role: { type: String, enum: ['doctor', 'patient', 'unknown'] },
      segments: [{ start: Number, end: Number, text: String }],
    }],
    full_transcript_formatted: String,
    gemini_analysis: {
      summary: String,
      clinical_notes: String,
      findings: [String],
      recommendations: [String],
      raw_response: String,
    },
    status: { type: String, enum: ['pending', 'transcribing', 'transcribed', 'analyzing', 'analyzed', 'failed'], default: 'pending' },
    error_message: String,
    duration_seconds: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recording', recordingSchema);
