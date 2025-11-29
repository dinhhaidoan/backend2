const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentStudent.controller');
const authMiddleware = require('../middleware/authMiddleware');
const requireSystemManager = require('../middleware/requireSystemManager');

// Public listing with optional student filter
router.get('/', parentController.list);
router.get('/:id', parentController.get);

// Create – authenticated
router.post('/', authMiddleware, parentController.create);
router.post('/students/:student_id/parents', authMiddleware, parentController.create);

// Update – authenticated
router.patch('/:id', authMiddleware, parentController.update);

// Delete – admin/system manager only
router.delete('/:id', authMiddleware, requireSystemManager, parentController.delete);

module.exports = router;
