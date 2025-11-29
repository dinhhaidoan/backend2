const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middleware/authMiddleware');
const requireSystemManager = require('../middleware/requireSystemManager');
const { enrollRules, updateRules, validate } = require('../middleware/validateEnrollment');

// Public
router.get('/', enrollmentController.list);
router.get('/:id', enrollmentController.getById);

// Protected: enroll/update/drop
router.post('/enroll', authMiddleware, enrollRules, validate, enrollmentController.enroll);
router.patch('/:id', authMiddleware, updateRules, validate, enrollmentController.update);
router.patch('/:id/drop', authMiddleware, enrollmentController.drop);

// Admin only: delete
router.delete('/:id', authMiddleware, requireSystemManager, enrollmentController.delete);

module.exports = router;