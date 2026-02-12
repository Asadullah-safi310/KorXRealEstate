const express = require('express');
const router = express.Router();
const {
  getProvinces,
  getDistricts,
  getAreas,
  createProvince,
  updateProvince,
  deleteProvince,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  createArea,
  updateArea,
  deleteArea,
} = require('../controllers/locationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public Routes
router.get('/provinces', getProvinces);
router.get('/provinces/:provinceId/districts', getDistricts);
router.get('/districts/:districtId/areas', getAreas);

// Admin Routes
router.post('/provinces', protect, admin, createProvince);
router.put('/provinces/:id', protect, admin, updateProvince);
router.delete('/provinces/:id', protect, admin, deleteProvince);

router.post('/districts', protect, admin, createDistrict);
router.put('/districts/:id', protect, admin, updateDistrict);
router.delete('/districts/:id', protect, admin, deleteDistrict);

router.post('/areas', protect, admin, createArea);
router.put('/areas/:id', protect, admin, updateArea);
router.delete('/areas/:id', protect, admin, deleteArea);

module.exports = router;
