const express = require('express');
const router = express.Router();
// const { authMiddleware, roleMiddleware } = require('../middleware/main');
const authRoute  = require('./auth.route');
const noteRoute = require('./note.route');
const academicYearRoute = require('./academic_year.route');
const semesterRoute = require('./semester.route');
const officeClassRoute = require('./office_class.route');


router.use('/share/auth', authRoute);
router.use('/share/notes', noteRoute);
router.use('/share/academic-years', academicYearRoute);
router.use('/share/semesters', semesterRoute);
router.use('/share/office-classes', officeClassRoute);

module.exports = router;
