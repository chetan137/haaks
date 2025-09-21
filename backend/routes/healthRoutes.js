const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  createHealthRecord,
  getHealthRecords,
  getLatestVitals,
  updateHealthRecord,
  getHealthSummary,
  scheduleHealthReminders
} = require('../controllers/healthController');

// All routes require authentication
router.use(authenticateToken);

// Health records
router.post('/records', createHealthRecord);
router.get('/records', getHealthRecords);
router.get('/records/:userId', getHealthRecords);
router.put('/records/:recordId', updateHealthRecord);

// Vitals
router.get('/vitals/latest', getLatestVitals);
router.get('/vitals/latest/:userId', getLatestVitals);

// Health summary
router.get('/summary', getHealthSummary);
router.get('/summary/:userId', getHealthSummary);

// Reminders
router.post('/reminders', scheduleHealthReminders);

module.exports = router;