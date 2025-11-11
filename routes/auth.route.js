const express = require('express');
const router = express.Router();
const { authController } = require('../controllers/main.controller');
const { validateLogin, validateRegister } = require('../middleware/validateAuth');

router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.post('/register', validateRegister, authController.register);
router.get('/users', authController.getAllUsers);
router.get('/users/:user_code', authController.getUserByCode);
router.patch('/users/:user_code', authController.updateUser);
router.delete('/users/:user_code', authController.deleteUser);

module.exports = router;