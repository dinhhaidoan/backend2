const express = require('express');
const router = express.Router();
// const { authMiddleware, roleMiddleware } = require('../middleware/main');
const authRoute  = require('./auth.route');
const noteRoute = require('./note.route');


router.use('/share/auth', authRoute);
router.use('/share/notes', noteRoute);

module.exports = router;
