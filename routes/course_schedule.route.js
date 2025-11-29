const express = require('express');
const router = express.Router();
const courseScheduleController = require('../controllers/courseSchedule.controller');
const authMiddleware = require('../middleware/authMiddleware');
const requireSystemManager = require('../middleware/requireSystemManager');
const { createRules, updateRules, validate } = require('../middleware/validateCourseSchedule');

// Public
router.get('/', courseScheduleController.list);
router.get('/:id', courseScheduleController.getById);

// Protected: create/update/delete
router.post('/', authMiddleware, requireSystemManager, createRules, validate, courseScheduleController.create);
router.patch('/:id', authMiddleware, requireSystemManager, updateRules, validate, courseScheduleController.update);
router.delete('/:id', authMiddleware, requireSystemManager, courseScheduleController.delete);

module.exports = router;
