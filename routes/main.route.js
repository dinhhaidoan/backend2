const express = require('express');
const router = express.Router();
// const { authMiddleware, roleMiddleware } = require('../middleware/main');
const authRoute  = require('./auth.route');


router.use('/share/auth', authRoute);

module.exports = router;
