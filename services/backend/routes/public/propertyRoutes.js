const express = require('express');
const router = express.Router();
const controllers = require('../../controllers/propertyController');
console.log('PropertyController exports:', Object.keys(controllers));

const { 
  getProperties, 
  getPropertyById, 
  searchProperties, 
  getAvailableProperties,
  getPropertiesByOwner,
  getPublicProperties,
  getPublicPropertiesByUser,
  getPropertyChildren
} = controllers;

router.get('/public', getPublicProperties);
router.get('/user/:id', getPublicPropertiesByUser);
router.get('/search', searchProperties);
router.get('/available', getAvailableProperties);
router.get('/owner/:id', getPropertiesByOwner);
router.get('/:id/children', getPropertyChildren);
router.get('/:id', getPropertyById);
router.get('/', getProperties);

module.exports = router;
