const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');

router.post('/', assignmentController.create);
router.get('/:id', assignmentController.getById);
router.post('/generate', assignmentController.autoCreate);

module.exports = router;