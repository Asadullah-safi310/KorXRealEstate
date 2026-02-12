const express = require('express');
const { check } = require('express-validator');
const {
  createPerson,
  getPersons,
  getPersonById,
  updatePerson,
  deletePerson,
  getAgents,
} = require('../controllers/personController');

const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');

const router = express.Router();

router.use(protect);

router.get('/agents/list', getAgents);

router.post(
  '/',
  upload.single('id_card'),
  [
    check('full_name').notEmpty().withMessage('Full name is required'),
    check('phone').notEmpty().withMessage('Phone is required'),
  ],
  createPerson
);

router.get('/', getPersons);

router.get('/:id', getPersonById);

router.put(
  '/:id',
  upload.single('id_card'),
  [
    check('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
    check('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  ],
  updatePerson
);

router.delete('/:id', deletePerson);

module.exports = router;
