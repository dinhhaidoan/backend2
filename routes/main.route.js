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
const groupRoute = require('./group.route');
const enrollmentRoute = require('./enrollment.route');
const baseRoute = require('./base.route');
const floorRoute = require('./floor.route');
const roomRoute = require('./room.route');
// Course schedule routes removed per requirement
const parentStudentRoute = require('./parent_student.route');


router.use('/share/auth', authRoute);
router.use('/share/notes', noteRoute);
router.use('/share/academic-years', academicYearRoute);
router.use('/share/semesters', semesterRoute);
router.use('/share/office-classes', officeClassRoute);
router.use('/share/courses', courseRoute);
router.use('/share/course-classes', courseClassRoute);
router.use('/share/groups', groupRoute);
router.use('/share/enrollments', enrollmentRoute);
router.use('/share/bases', baseRoute);
router.use('/share/floors', floorRoute);
router.use('/share/rooms', roomRoute);
// course-schedules removed
router.use('/share/parents', parentStudentRoute);

module.exports = router;
