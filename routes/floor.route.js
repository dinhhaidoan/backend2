const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floor.controller');
const roomController = require('../controllers/room.controller');

// Public endpoints
router.get('/', floorController.list);
router.get('/:id', floorController.getById);
// convenience: get rooms by floor id
router.get('/:id/rooms', (req, res, next) => {
	req.query.floor_id = req.params.id;
	return roomController.list(req, res, next);
});

module.exports = router;
