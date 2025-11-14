const express = require('express');
const router = express.Router();
const { noteController } = require('../controllers/main.controller');

// Create note
router.post('/', noteController.create);

// List notes (query: user_code, user_id, tag, category_id, status, priority, favorite, archived, page, limit)
router.get('/', noteController.list);

// Categories summary: total unique notes per category for a user
router.get('/categories-summary', noteController.categoriesSummary);

// Get single note
router.get('/:note_id', noteController.get);

// Update note
router.patch('/:note_id', noteController.update);

// Delete note
router.delete('/:note_id', noteController.delete);

module.exports = router;
