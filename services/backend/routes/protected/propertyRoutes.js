const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { 
  createProperty, 
  updateProperty, 
  updatePropertyStatus, 
  deleteProperty, 
  uploadFiles, 
  deleteFile, 
  getPropertiesByTenant, 
  updatePropertyAvailability,
  getMyProperties,
  getPropertyById,
  searchProperties,
  getDashboardStats,
  addChildProperty,
  getPropertyChildren
} = require('../../controllers/propertyController');
const { upload } = require('../../utils/upload');
const { hasPermission } = require('../../middleware/authMiddleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.get('/dashboard/stats', getDashboardStats);
router.get('/search', searchProperties);
router.get('/', hasPermission(PERMISSIONS.MY_PROPERTIES), getMyProperties);
router.get('/my-properties', hasPermission(PERMISSIONS.MY_PROPERTIES), getMyProperties);
router.get('/:id/children', getPropertyChildren);
router.get('/:id', getPropertyById);

router.post('/', hasPermission(PERMISSIONS.ADD_PROPERTY), [
  body('property_type').notEmpty().withMessage('Property type is required'),
  body('purpose').notEmpty().withMessage('Purpose is required'),
  body('province_id').notEmpty().withMessage('Province is required'),
  body('district_id').notEmpty().withMessage('District is required'),
  body('area_id').notEmpty().withMessage('Area is required'),
  body('area_size').notEmpty().withMessage('Area size is required'),
], createProperty);

router.get('/tenant/:id', getPropertiesByTenant);

router.put('/:id', [
  body('property_type').notEmpty().withMessage('Property type is required'),
  body('purpose').notEmpty().withMessage('Purpose is required'),
  body('province_id').notEmpty().withMessage('Province is required'),
  body('district_id').notEmpty().withMessage('District is required'),
  body('area_id').notEmpty().withMessage('Area is required'),
  body('area_size').notEmpty().withMessage('Area size is required'),
], updateProperty);

router.patch('/:id/status', hasPermission(PERMISSIONS.MY_PROPERTIES), updatePropertyStatus);
router.put('/:id/availability', hasPermission(PERMISSIONS.MY_PROPERTIES), updatePropertyAvailability);
router.post('/:id/children', hasPermission(PERMISSIONS.ADD_PROPERTY), addChildProperty);
router.post(
  '/:id/upload',
  hasPermission(PERMISSIONS.MY_PROPERTIES, PERMISSIONS.MY_TOWERS, PERMISSIONS.MY_MARKETS, PERMISSIONS.MY_SHARAKS),
  upload.array('files', 10),
  uploadFiles
);
router.delete(
  '/:id/file',
  hasPermission(PERMISSIONS.MY_PROPERTIES, PERMISSIONS.MY_TOWERS, PERMISSIONS.MY_MARKETS, PERMISSIONS.MY_SHARAKS),
  deleteFile
);
router.delete('/:id', hasPermission(PERMISSIONS.MY_PROPERTIES), deleteProperty);

module.exports = router;
