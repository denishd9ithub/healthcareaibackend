const express = require('express');
const { body, param } = require('express-validator');
const { auth } = require('../middleware/auth');
const { list, getById, create, update, remove } = require('../controllers/patientsController');

const router = express.Router();
router.use(auth);

router.get('/', list);
router.get('/:id', [param('id').isMongoId()], getById);
router.post(
  '/',
  [
    body('full_name').trim().notEmpty(),
    body('date_of_birth').optional().isISO8601(),
    body('gender').optional().trim(),
    body('phone').optional().trim(),
    body('email').optional().isEmail(),
    body('address').optional().trim(),
    body('user_id').optional().isMongoId(),
  ],
  create
);
router.patch(
  '/:id',
  [
    param('id').isMongoId(),
    body('full_name').optional().trim().notEmpty(),
    body('date_of_birth').optional().isISO8601(),
    body('gender').optional().trim(),
    body('phone').optional().trim(),
    body('email').optional().isEmail(),
    body('address').optional().trim(),
  ],
  update
);
router.delete('/:id', [param('id').isMongoId()], remove);

module.exports = router;
