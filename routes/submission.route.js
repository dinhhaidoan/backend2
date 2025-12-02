const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');

// GET /api/share/submissions - Lấy danh sách bài nộp
router.get('/', submissionController.getAll);

// GET /api/share/submissions/:id - Lấy chi tiết 1 bài nộp
router.get('/:id', submissionController.getById);

// POST /api/share/submissions - Nộp bài
router.post('/', submissionController.submit);

// PATCH /api/share/submissions/details/:detail_id - Sửa điểm
router.patch('/details/:detail_id', submissionController.updateGrade);

module.exports = router;