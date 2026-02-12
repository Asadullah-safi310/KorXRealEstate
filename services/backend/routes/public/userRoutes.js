const express = require('express');
const router = express.Router();
const { getPublicUserProfile, getPublicAgents, getPublicPropertyListers } = require('../../controllers/public/userController');

router.get('/agents/list', getPublicAgents);
router.get('/listers/list', getPublicPropertyListers);
router.get('/:id', getPublicUserProfile);

module.exports = router;
