const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const authMiddleware = require('../middleware/authMiddleware');
const requireSystemManager = require('../middleware/requireSystemManager');
const { createRules, updateRules, validate } = require('../middleware/validateCourse');

// Public
router.get('/', courseController.list);
router.get('/:id', courseController.getById);

// Protected
router.post('/', authMiddleware, requireSystemManager, createRules, validate, courseController.create);
router.patch('/:id', authMiddleware, requireSystemManager, updateRules, validate, courseController.update);
router.delete('/:id', authMiddleware, requireSystemManager, courseController.delete);

module.exports = router;
