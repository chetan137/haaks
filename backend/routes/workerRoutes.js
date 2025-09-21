const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getWorkerProfile,
  updateWorkerProfile,
  getAllWorkers,
  getWorkerById,
  connectToWorker,
  disconnectFromWorker,
  rateWorker
} = require('../controllers/workerController');

// Worker profile routes (require authentication)
router.get('/profile', authenticateToken, getWorkerProfile);
router.put('/profile', authenticateToken, updateWorkerProfile);

// Public worker discovery routes
router.get('/', getAllWorkers);
router.get('/:workerId', getWorkerById);

// User-worker connection routes (require authentication)
router.post('/:workerId/connect', authenticateToken, connectToWorker);
router.delete('/:workerId/connect', authenticateToken, disconnectFromWorker);
router.post('/:workerId/rate', authenticateToken, rateWorker);

module.exports = router;