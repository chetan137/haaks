const express = require('express');
const router = express.Router();
const { modernizeLegacyFiles } = require('../controllers/modernizeController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * @route   POST /api/v1/modernize
 * @desc    Modernize legacy COBOL files using AI
 * @access  Private (requires authentication)
 * @body    Form-data with two files:
 *          - copybook: .cpy file (COBOL copybook)
 *          - datafile: .dat file (legacy data file)
 */
router.post(
    '/modernize',
    authenticateToken,
    upload.fields([
        { name: 'copybook', maxCount: 1 },
        { name: 'datafile', maxCount: 1 }
    ]),
    modernizeLegacyFiles
);

/**
 * @route   POST /api/v1/modernize-demo
 * @desc    Demo endpoint for testing without authentication
 * @access  Public (for testing purposes)
 */
router.post(
    '/modernize-demo',
    upload.fields([
        { name: 'copybook', maxCount: 1 },
        { name: 'datafile', maxCount: 1 }
    ]),
    (req, res, next) => {
        // Add a mock user for demo purposes
        req.user = { email: 'demo@example.com', _id: 'demo-user' };
        modernizeLegacyFiles(req, res, next);
    }
);

module.exports = router;