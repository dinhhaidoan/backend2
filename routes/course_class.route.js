const express = require('express');
const router = express.Router();
const courseClassController = require('../controllers/courseClass.controller');
const authMiddleware = require('../middleware/authMiddleware');
const requireSystemManager = require('../middleware/requireSystemManager');
const { createRules, updateRules, validate } = require('../middleware/validateCourseClass');

// Public
router.get('/', courseClassController.list);
router.get('/:id', courseClassController.getById);

// Protected: create/update/delete
router.post('/', authMiddleware, requireSystemManager, createRules, validate, courseClassController.create);
router.patch('/:id', authMiddleware, requireSystemManager, updateRules, validate, courseClassController.update);
router.delete('/:id', authMiddleware, requireSystemManager, courseClassController.delete);

module.exports = router;
