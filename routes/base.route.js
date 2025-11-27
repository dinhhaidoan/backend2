const express = require('express');
const router = express.Router();
const baseController = require('../controllers/base.controller');
const floorController = require('../controllers/floor.controller');
const roomController = require('../controllers/room.controller');

// Public endpoints
router.get('/', baseController.list);
router.get('/:id', baseController.getById);
// convenience: get floors by base_code (example: /api/share/bases/L/floors)
router.get('/:base_code/floors', (req, res, next) => {
	// set query param and forward to floor list
	req.query.base_code = req.params.base_code;
	return floorController.list(req, res, next);
});
// convenience: get rooms by base_code + floor_number (example: /api/share/bases/L/floors/1/rooms)
router.get('/:base_code/floors/:floor_number/rooms', (req, res, next) => {
	req.query.base_code = req.params.base_code;
	req.query.floor_number = req.params.floor_number;
	return roomController.list(req, res, next);
});

module.exports = router;
