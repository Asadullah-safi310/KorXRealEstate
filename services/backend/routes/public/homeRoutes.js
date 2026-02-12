const express = require('express');
const router = express.Router();
const homeController = require('../../controllers/public/homeController');

router.get('/containers', homeController.getHomeContainers);

module.exports = router;
