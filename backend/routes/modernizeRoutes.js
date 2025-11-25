const express = require('express');
const router = express.Router();
const { modernizeLegacyFiles, queryData, refineGeneratedCode } = require('../controllers/modernizeController');
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
    upload.any(), // Accept any file fields
    (req, res, next) => {
        // Add a mock user for demo purposes
        req.user = { email: 'demo@example.com', _id: 'demo-user' };

        // Reorganize files into expected structure
        if (req.files && Array.isArray(req.files)) {
            req.files = {
                copybook: req.files.filter(f => f.originalname.toLowerCase().endsWith('.cpy')),
                datafile: req.files.filter(f => f.originalname.toLowerCase().endsWith('.dat'))
            };
        }

        modernizeLegacyFiles(req, res, next);
    }
);

/**
 * @route   POST /api/v1/query
 * @desc    Talk to your Data - Convert natural language questions to MongoDB queries and execute them
 * @access  Private (requires authentication)
 * @body    JSON with question field: { "question": "Show me all customers from California" }
 */
router.post(
    '/query',
    authenticateToken,
    queryData
);

/**
 * @route   POST /api/v1/refine
 * @desc    AI Co-Pilot - Refine generated code based on user instructions
 * @access  Private (requires authentication)
 * @body    JSON with code and instruction fields: { "code": "...", "instruction": "add error handling" }
 */
router.post(
    '/refine',
    authenticateToken,
    refineGeneratedCode
);

module.exports = router;
