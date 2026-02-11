const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config/env');

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password, full_name, role } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, full_name: full_name || null, role: role || 'user' });
    const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.status(201).json({ user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role }, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).select('email password_hash full_name role _id');
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({ user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role }, token });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
