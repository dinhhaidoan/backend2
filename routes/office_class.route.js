const express = require('express');
const router = express.Router();
const officeClassController = require('../controllers/officeClass.controller');
const authMiddleware = require('../middleware/authMiddleware');
const requireSystemManager = require('../middleware/requireSystemManager');
const { createRules, updateRules, validate } = require('../middleware/validateOfficeClass');

// Public
router.get('/', officeClassController.list);
router.get('/:id', officeClassController.getById);

// Protected: create/update/delete
router.post('/', authMiddleware, requireSystemManager, createRules, validate, officeClassController.create);
router.patch('/:id', authMiddleware, requireSystemManager, updateRules, validate, officeClassController.update);
router.delete('/:id', authMiddleware, requireSystemManager, officeClassController.delete);

module.exports = router;
