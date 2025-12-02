const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analytics.controller');

// GET /api/share/analytics?student_id=1
// Requires authentication
router.get('/', authMiddleware, analyticsController.getStudentReport);

module.exports = router;