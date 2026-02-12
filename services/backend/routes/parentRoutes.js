const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { protect, hasPermission } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

const checkParentPermission = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  let category = req.body?.property_category || req.parent?.property_category;
  if (category === 'apartment') category = 'tower';
  
  const permissionMap = {
    'tower': PERMISSIONS.MY_TOWERS,
    'market': PERMISSIONS.MY_MARKETS,
    'sharak': PERMISSIONS.MY_SHARAKS,
  };

  const requiredPermission = permissionMap[category];
  
  if (!requiredPermission) {
    return res.status(400).json({ message: 'Invalid property category' });
  }

  return hasPermission(requiredPermission)(req, res, next);
};

router.get('/parents/:id', parentController.getParentById);
router.get('/parents/:id/children', parentController.getParentChildren);

router.post('/parents', protect, checkParentPermission, parentController.createParent);
router.get('/agent/parents', protect, hasPermission(PERMISSIONS.MY_TOWERS, PERMISSIONS.MY_MARKETS, PERMISSIONS.MY_SHARAKS), parentController.getAgentParents);
router.post('/parents/:id/children', protect, parentController.createChild);
router.put('/parents/:id', protect, parentController.updateParent);
router.delete('/parents/:id', protect, parentController.deleteParent);

module.exports = router;
