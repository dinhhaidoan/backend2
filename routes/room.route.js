const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');

// Public endpoints — only list & get by id for read-only UX
router.get('/', roomController.list);
router.get('/:id', roomController.getById);

module.exports = router;
