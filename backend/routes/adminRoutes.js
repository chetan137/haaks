const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  createAshaWorker,
  getAllAshaWorkers,
  updateAshaWorker,
  deleteAshaWorker,
  toggleWorkerStatus,
  getAdminStats
} = require('../controllers/adminController');

// Admin middleware - requires admin role
const adminAuth = [authenticateToken, authorizeRole('admin')];

// Admin dashboard stats
router.get('/stats', adminAuth, getAdminStats);

// ASHA worker management routes
router.post('/workers', adminAuth, createAshaWorker);
router.get('/workers', adminAuth, getAllAshaWorkers);
router.put('/workers/:workerId', adminAuth, updateAshaWorker);
router.delete('/workers/:workerId', adminAuth, deleteAshaWorker);
router.patch('/workers/:workerId/toggle-status', adminAuth, toggleWorkerStatus);

module.exports = router;