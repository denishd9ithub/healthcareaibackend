const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');

async function list(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);
    const { patient_id, doctor_id, status } = req.query;
    const filter = {};
    if (patient_id) filter.patient_id = patient_id;
    if (doctor_id) filter.doctor_id = doctor_id;
    if (status) filter.status = status;
    const [data, total] = await Promise.all([
      Appointment.find(filter).select('-__v').sort({ scheduled_at: -1 }).skip(offset).limit(limit).lean(),
      Appointment.countDocuments(filter),
    ]);
    res.json({ data, total });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Appointment.findById(id).select('-__v').lean();
    if (!doc) return res.status(404).json({ error: 'Appointment not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { patient_id, doctor_id, scheduled_at, status, notes } = req.body;
    const payload = { patient_id, scheduled_at, status: status || 'scheduled', notes: notes || null };
    if (doctor_id) payload.doctor_id = doctor_id;
    const doc = await Appointment.create(payload);
    const out = doc.toObject();
    delete out.__v;
    res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    const { doctor_id, scheduled_at, status, notes } = req.body;
    const updateFields = {};
    if (doctor_id !== undefined) updateFields.doctor_id = doctor_id;
    if (scheduled_at !== undefined) updateFields.scheduled_at = scheduled_at;
    if (status !== undefined) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;
    const doc = await Appointment.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).select('-__v').lean();
    if (!doc) return res.status(404).json({ error: 'Appointment not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Appointment.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Appointment not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
