const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// GET /api/share/analytics?student_id=1
router.get('/', analyticsController.getStudentReport);

module.exports = router;