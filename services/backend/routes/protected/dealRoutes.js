const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { createDeal, getDealsByUser, getDealById } = require('../../controllers/dealController');
const { hasPermission } = require('../../middleware/authMiddleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.post('/', hasPermission(PERMISSIONS.TRANSACTION_HISTORY), [
  body('property_id').notEmpty().isInt().withMessage('Property ID is required and must be an integer'),
  body('deal_type').notEmpty().isIn(['SALE', 'RENT']).withMessage('Deal type must be SALE or RENT'),
  body('seller_person_id').optional({ checkFalsy: true }).isInt().withMessage('Seller (Person) ID must be an integer'),
  body('buyer_person_id').notEmpty().isInt().withMessage('Buyer/Tenant (Person) ID is required'),
  body('start_date').optional({ checkFalsy: true }).isISO8601().withMessage('Start date must be a valid date'),
  body('price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('notes').optional(),
], createDeal);

router.get('/', hasPermission(PERMISSIONS.TRANSACTION_HISTORY), getDealsByUser);

router.get('/:id', hasPermission(PERMISSIONS.TRANSACTION_HISTORY), getDealById);

module.exports = router;
