const express = require('express');
const authRoutes = require('./auth');
const patientsRoutes = require('./patients');
const appointmentsRoutes = require('./appointments');
const recordingsRoutes = require('./recordings');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.use('/auth', authRoutes);
router.use('/patients', patientsRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/recordings', recordingsRoutes);

module.exports = router;
