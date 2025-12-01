const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');

// POST /api/share/submissions
router.post('/', submissionController.submit);
router.patch('/details/:detail_id', authMiddleware, submissionController.updateGrade);

module.exports = router;