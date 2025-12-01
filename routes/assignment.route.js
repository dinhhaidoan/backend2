const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');

router.post('/', assignmentController.create);
router.get('/', assignmentController.getAll);
router.get('/:id', assignmentController.getById);
router.delete('/:id', assignmentController.delete);
router.post('/generate', assignmentController.autoCreate);

module.exports = router;