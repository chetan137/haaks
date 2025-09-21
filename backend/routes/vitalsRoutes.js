const express = require('express');
const router = express.Router();
const vitalsController = require('../controllers/vitalsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Test endpoint (no auth required) - must be before auth middleware
router.post('/test', async (req, res) => {
  try {
    const { vitalType, values } = req.body;
    const { analyzeVital } = require('../config/healthThresholds');

    if (!vitalType || !values) {
      return res.status(400).json({
        success: false,
        error: 'vitalType and values are required'
      });
    }

    const analysis = analyzeVital(vitalType, values);

    res.json({
      success: true,
      data: {
        analysis,
        vitalType,
        values,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Vitals Test Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze vital'
    });
  }
});

// All other routes require authentication
router.use(authenticateToken);

// Main vitals logging and management
router.post('/log', vitalsController.logVitals);
router.get('/today', vitalsController.getTodaysVitals);
router.get('/history', vitalsController.getVitalsHistory);
router.get('/summary', vitalsController.getVitalsSummary);
router.delete('/:vitalsId', vitalsController.deleteVitals);

// Quick entry for specific vital types
router.post('/quick/:vitalType', vitalsController.quickVitalEntry);

// Analysis and trends
router.post('/analyze', vitalsController.analyzeVitalReading);
router.get('/trends', vitalsController.getVitalsTrends);

module.exports = router;