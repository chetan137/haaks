const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Chat session routes
router.post('/session/start', authenticateToken, chatbotController.startChatSession);
router.post('/message', authenticateToken, chatbotController.sendMessage);
router.get('/session/:sessionId', authenticateToken, chatbotController.getConversationHistory);
router.get('/sessions', authenticateToken, chatbotController.getChatSessions);

// Voice interaction routes
router.post('/voice/call', authenticateToken, chatbotController.startVoiceCall);
router.post('/voice/webrtc', authenticateToken, chatbotController.startWebRTCCall);
router.delete('/voice/call/:callId', authenticateToken, chatbotController.endVoiceCall);

// Health features
router.get('/health/tips', authenticateToken, chatbotController.generateHealthTips);
router.post('/health/symptoms', authenticateToken, chatbotController.analyzeSymptoms);

// Webhook for Vapi (no auth required for external webhooks)
router.post('/webhook/vapi', chatbotController.handleVapiWebhook);

// Test endpoint for AI functionality
router.post('/test', chatbotController.testChatbot);

module.exports = router;