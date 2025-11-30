const express = require('express');
const router = express.Router();
// const { authMiddleware, roleMiddleware } = require('../middleware/main');
const authRoute  = require('./auth.route');
const noteRoute = require('./note.route');
const academicYearRoute = require('./academic_year.route');
const semesterRoute = require('./semester.route');
const officeClassRoute = require('./office_class.route');
const courseRoute = require('./course.route');
const courseClassRoute = require('./course_class.route');
const parentStudentRoute = require('./parent_student.route');
const lessonRoute = require('./lesson.route');


router.use('/share/auth', authRoute);
router.use('/share/notes', noteRoute);
router.use('/share/academic-years', academicYearRoute);
router.use('/share/semesters', semesterRoute);
router.use('/share/office-classes', officeClassRoute);
router.use('/share/courses', courseRoute);
router.use('/share/course-classes', courseClassRoute);
router.use('/share/parents', parentStudentRoute);
router.use('/share/lessons', lessonRoute);

module.exports = router;
