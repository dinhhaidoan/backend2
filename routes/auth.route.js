const express = require('express');
const router = express.Router();
const { authController } = require('../controllers/main.controller');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../utils/uploadAvatar');
const { validateLogin, validateRegister } = require('../middleware/validateAuth');

router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.post('/change-password', authMiddleware, authController.changePassword);
router.get('/me', authMiddleware, authController.me);
router.post('/register', validateRegister, authController.register);
router.post('/users', authController.register);
router.post('/users/:user_code/avatar', authMiddleware, upload.single('avatar'), authController.uploadAvatar);
router.get('/users/:user_code/avatar', authController.getAvatar);
router.get('/academic-degrees', authController.getAcademicDegrees);
router.get('/positions', authController.getPositions);
router.get('/majors', authController.getMajors);
router.get('/teachers', authController.getTeachers);
router.get('/teachers/code/:teacher_code', authController.getTeacherByCode);
router.get('/users', authController.getAllUsers);
router.get('/users/:user_code', authController.getUserByCode);
router.patch('/users/:user_code', authController.updateUser);
router.delete('/users/:user_code', authController.deleteUser);

module.exports = router;