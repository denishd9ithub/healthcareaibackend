const fs = require('fs').promises;
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Recording = require('../models/Recording');
const deepgramService = require('../services/deepgramService');
const geminiService = require('../services/geminiService');
const config = require('../config/env');

async function upload(req, res, next) {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'No audio file provided' });
  }
  if (!config.deepgramApiKey) {
    return res.status(503).json({ error: 'Transcription service not configured' });
  }
  const recording = await Recording.create({
    uploaded_by: req.user.id,
    original_filename: req.file.originalname || 'audio.mp3',
    file_path: req.file.path,
    status: 'transcribing',
  });
  const contentType = req.file.mimetype || 'audio/mpeg';
  try {
    const buffer = await fs.readFile(req.file.path);
    const { rawTranscript, duration, utterances, fullResponse } = await deepgramService.transcribe(buffer, contentType);
    await Recording.findByIdAndUpdate(recording._id, {
      raw_transcript: fullResponse,
      utterances,
      duration_seconds: duration,
      status: 'transcribed',
    });
    let doctorSpeaker = 0;
    let patientSpeaker = 1;
    if (config.geminiApiKey && utterances.length > 0) {
      const roleMap = await geminiService.identifyDoctorAndPatient(utterances);
      doctorSpeaker = roleMap.doctorSpeaker ?? 0;
      patientSpeaker = roleMap.patientSpeaker ?? 1;
    }
    const fullFormatted = await geminiService.formatTranscriptByRole(utterances, doctorSpeaker, patientSpeaker);
    const speakerToRole = {};
    speakerToRole[doctorSpeaker] = 'doctor';
    speakerToRole[patientSpeaker] = 'patient';
    const bySpeaker = new Map();
    for (const u of utterances) {
      if (!bySpeaker.has(u.speaker)) {
        bySpeaker.set(u.speaker, []);
      }
      bySpeaker.get(u.speaker).push({ start: u.start, end: u.end, text: u.transcript });
    }
    const transcriptBySpeaker = Array.from(bySpeaker.entries()).map(([speaker_index, segments]) => ({
      speaker_index,
      role: speakerToRole[speaker_index] || 'unknown',
      segments,
    }));
    await Recording.findByIdAndUpdate(recording._id, {
      full_transcript_formatted: fullFormatted,
      transcript_by_speaker: transcriptBySpeaker,
      status: 'analyzing',
    });
    let geminiAnalysis = { summary: '', clinical_notes: '', findings: [], recommendations: [], raw_response: '' };
    if (config.geminiApiKey) {
      geminiAnalysis = await geminiService.analyzeClinical(fullFormatted);
    }
    const updated = await Recording.findByIdAndUpdate(
      recording._id,
      { gemini_analysis: geminiAnalysis, status: 'analyzed' },
      { new: true }
    ).select('-__v').lean();
    res.status(201).json(updated);
  } catch (err) {
    await Recording.findByIdAndUpdate(recording._id, { status: 'failed', error_message: err.message });
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);
    const filter = {};
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      filter.uploaded_by = req.user.id;
    }
    const [data, total] = await Promise.all([
      Recording.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).select('-__v').lean(),
      Recording.countDocuments(filter),
    ]);
    res.json({ data, total });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid recording id', details: errors.array() });
    }
    const { id } = req.params;
    const doc = await Recording.findById(id).select('-__v').lean();
    if (!doc) return res.status(404).json({ error: 'Recording not found' });
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin' && doc.uploaded_by?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function analyze(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid recording id', details: errors.array() });
    }
    const { id } = req.params;
    const objectId = new mongoose.Types.ObjectId(id);

    const recording = await Recording.findById(objectId);
    if (!recording) return res.status(404).json({ error: 'Recording not found' });
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin' && recording.uploaded_by?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!recording.full_transcript_formatted) {
      return res.status(400).json({ error: 'No transcript to analyze' });
    }
    if (!config.geminiApiKey) {
      return res.status(503).json({ error: 'Gemini not configured' });
    }
    await Recording.findByIdAndUpdate(objectId, { status: 'analyzing' });
    const geminiAnalysis = await geminiService.analyzeClinical(recording.full_transcript_formatted);
    const sanitizedAnalysis = {
      summary: String(geminiAnalysis?.summary ?? ''),
      clinical_notes: String(geminiAnalysis?.clinical_notes ?? ''),
      findings: Array.isArray(geminiAnalysis?.findings) ? geminiAnalysis.findings.map((f) => String(f)) : [],
      recommendations: Array.isArray(geminiAnalysis?.recommendations) ? geminiAnalysis.recommendations.map((r) => String(r)) : [],
      raw_response: String(geminiAnalysis?.raw_response ?? ''),
    };
    const updated = await Recording.findByIdAndUpdate(
      objectId,
      { gemini_analysis: sanitizedAnalysis, status: 'analyzed' },
      { new: true }
    ).select('-__v').lean();
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, list, getById, analyze };
