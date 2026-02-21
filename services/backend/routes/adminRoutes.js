const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAllProperties,
  getAllDeals,
  getUserPermissions,
  updateUserPermissions,
  getAvailablePermissions,
  getUserContainerLimits,
  updateUserContainerLimits,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/stats', getDashboardStats);

router.use(admin);

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/properties', getAllProperties);
router.get('/deals', getAllDeals);

router.get('/permissions', getAvailablePermissions);
router.get('/users/:id/permissions', getUserPermissions);
router.put('/users/:id/permissions', updateUserPermissions);
router.get('/users/:id/container-limits', getUserContainerLimits);
router.put('/users/:id/container-limits', updateUserContainerLimits);

module.exports = router;
