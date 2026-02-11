const express = require('express');
const { param } = require('express-validator');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { upload: multerUpload } = require('../config/multer');
const { upload, list, getById, analyze } = require('../controllers/recordingsController');

const router = express.Router();

router.use(auth);

router.post('/upload', requireRole(['superadmin', 'admin']), multerUpload.single('audio'), upload);
router.get('/', list);
router.get('/:id', [param('id').isMongoId()], getById);
router.post('/:id/analyze', [param('id').isMongoId()], analyze);

module.exports = router;
