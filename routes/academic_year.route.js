const express = require('express');
const router = express.Router();
const academicYearController = require('../controllers/academicYear.controller');
const authMiddleware = require('../middleware/authMiddleware');
const requireSystemManager = require('../middleware/requireSystemManager');
const { createRules, updateRules, validate } = require('../middleware/validateAcademicYear');

// Public: list & get
router.get('/', academicYearController.list);
router.get('/:id', academicYearController.getById);

// Protected: create / update / delete (staff/admin)
router.post('/', authMiddleware, requireSystemManager, createRules, validate, academicYearController.create);
router.patch('/:id', authMiddleware, requireSystemManager, updateRules, validate, academicYearController.update);
router.delete('/:id', authMiddleware, requireSystemManager, academicYearController.delete);

module.exports = router;
