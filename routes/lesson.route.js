const express = require('express');
const router = express.Router();
const { lessonController } = require('../controllers/main.controller');
const { createRules, updateRules, validate } = require('../middleware/validateLesson');
const authMiddleware = require('../middleware/authMiddleware');
const requireSystemManager = require('../middleware/requireSystemManager');

// Create lesson (requires permission)
router.post('/', authMiddleware, requireSystemManager, createRules, validate, lessonController.create);

// List lessons (query: page, limit, q, course_class_id, status)
router.get('/', lessonController.list);

// Get single lesson
router.get('/:id', lessonController.getById);

// Update lesson
router.patch('/:id', authMiddleware, requireSystemManager, updateRules, validate, lessonController.update);

// Delete lesson
router.delete('/:id', authMiddleware, requireSystemManager, lessonController.delete);

module.exports = router;
