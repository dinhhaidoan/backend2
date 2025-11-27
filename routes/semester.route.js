const express = require('express');
const router = express.Router();
const semesterController = require('../controllers/semester.controller');
const authMiddleware = require('../middleware/authMiddleware');
const requireSystemManager = require('../middleware/requireSystemManager');
const { createRules, updateRules, validate } = require('../middleware/validateSemester');

// Public: list & get
router.get('/', semesterController.list);
router.get('/:id', semesterController.getById);

// Protected: create / update / delete (staff/admin)
router.post('/', authMiddleware, requireSystemManager, createRules, validate, semesterController.create);
router.patch('/:id', authMiddleware, requireSystemManager, updateRules, validate, semesterController.update);
router.delete('/:id', authMiddleware, requireSystemManager, semesterController.delete);

module.exports = router;
