const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');

router.post('/generate', assignmentController.autoCreate);
router.post('/', assignmentController.create);
router.get('/', assignmentController.getAll);
router.get('/:id/submissions', assignmentController.getSubmissions);
router.get('/:id', assignmentController.getById);
router.put('/:id', assignmentController.update);
router.delete('/:id', assignmentController.delete);


module.exports = router;