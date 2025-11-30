const express = require('express');
const router = express.Router();
const { lessonController } = require('../controllers/main.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { createRules, updateRules, validate } = require('../middleware/validateLesson');

// List lessons (query: course_class_id, teacher_code, page, limit)
router.get('/', lessonController.list);

// Get single lesson
router.get('/:lesson_id', lessonController.get);

// Create lesson (authenticated)
router.post('/', authMiddleware, createRules, validate, lessonController.create);

// Update lesson
router.patch('/:lesson_id', authMiddleware, updateRules, validate, lessonController.update);

// Delete lesson
router.delete('/:lesson_id', authMiddleware, lessonController.delete);

module.exports = router;
