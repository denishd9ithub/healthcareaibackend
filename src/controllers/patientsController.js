const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Patient = require('../models/Patient');

async function list(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);
    const [data, total] = await Promise.all([
      Patient.find().select('-__v').sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      Patient.countDocuments(),
    ]);
    res.json({ data, total });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Patient.findById(id).select('-__v').lean();
    if (!doc) return res.status(404).json({ error: 'Patient not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { full_name, date_of_birth, gender, phone, email, address, user_id } = req.body;
    const payload = { full_name, date_of_birth: date_of_birth || null, gender: gender || null, phone: phone || null, email: email || null, address: address || null };
    if (user_id && mongoose.isValidObjectId(user_id)) payload.user_id = user_id;
    const doc = await Patient.create(payload);
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
    const { full_name, date_of_birth, gender, phone, email, address } = req.body;
    const updateFields = {};
    if (full_name !== undefined) updateFields.full_name = full_name;
    if (date_of_birth !== undefined) updateFields.date_of_birth = date_of_birth;
    if (gender !== undefined) updateFields.gender = gender;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    if (address !== undefined) updateFields.address = address;
    const doc = await Patient.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).select('-__v').lean();
    if (!doc) return res.status(404).json({ error: 'Patient not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Patient.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Patient not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
