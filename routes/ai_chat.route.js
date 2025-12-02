const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/ai_chat.controller');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/share/ai/chat
router.post('/chat', authMiddleware, aiChatController.chat);

module.exports = router;
