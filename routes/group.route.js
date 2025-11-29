const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const authMiddleware = require('../middleware/authMiddleware');
const requireSystemManager = require('../middleware/requireSystemManager');
const { createRules, updateRules, validate } = require('../middleware/validateGroup');

// Public
router.get('/', groupController.list);
router.get('/:id', groupController.getById);

// Protected: create/update/delete
router.post('/', authMiddleware, requireSystemManager, createRules, validate, groupController.create);
router.patch('/:id', authMiddleware, requireSystemManager, updateRules, validate, groupController.update);
router.delete('/:id', authMiddleware, requireSystemManager, groupController.delete);

module.exports = router;