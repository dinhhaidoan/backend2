const { sequelize, models } = require('../models/index.model');
const { Enrollment, Student, CourseClass, Group, Course, Teacher, User, Semester, Base, Floor, Room } = models;
const { Op } = require('sequelize');

const listEnrollments = async ({ course_class_id, group_id, student_id, page = 1, limit = 20 } = {}) => {
  const offset = Math.max(0, (Number(page) - 1)) * Number(limit);
  const where = {};
  if (course_class_id) where.course_class_id = Number(course_class_id);
  if (group_id) where.group_id = Number(group_id);
  if (student_id) where.student_id = Number(student_id);

  const result = await Enrollment.findAndCountAll({
    where,
    include: [ 
      { model: Student }, 
      { 
        model: CourseClass, 
        include: [
          { model: Course },
          { model: Semester },
          { model: Teacher, include: [{ model: User }] },
          { model: Base },
          { model: Floor },
          { model: Room }
        ]
      }, 
      { model: Group } 
    ],
    limit: Number(limit),
    offset,
    order: [['enrollment_id', 'DESC']],
  });

  return {
    items: result.rows,
    total: result.count,
    page: Number(page),
    limit: Number(limit),
    lastPage: Math.ceil(result.count / Number(limit) || 1),
  };
};

const getEnrollment = async (id) => {
  if (!id) throw new Error('Missing enrollment_id');
  const row = await Enrollment.findOne({ 
    where: { enrollment_id: id }, 
    include: [ 
      { model: Student }, 
      { 
        model: CourseClass, 
        include: [
          { model: Course },
          { model: Semester },
          { model: Teacher, include: [{ model: User }] },
          { model: Base },
          { model: Floor },
          { model: Room }
        ]
      }, 
      { model: Group } 
    ] 
  });
  if (!row) throw new Error('Enrollment not found');
  return row;
};

const enrollStudent = async (payload = {}) => {
  const { student_id, course_class_id, group_id } = payload;
  if (!student_id) throw new Error('student_id is required');
  if (!course_class_id) throw new Error('course_class_id is required');

  const student = await Student.findOne({ where: { student_id: Number(student_id) } });
  if (!student) throw new Error('student not found');

  const courseClass = await CourseClass.findOne({ where: { course_class_id: Number(course_class_id) } });
  if (!courseClass) throw new Error('course_class not found');

  // Check if already enrolled
  const existing = await Enrollment.findOne({ where: { student_id: Number(student_id), course_class_id: Number(course_class_id) } });
  if (existing) throw new Error('Student already enrolled in this course class');

  // If group_id provided, check capacity
  if (group_id) {
    const group = await Group.findOne({ where: { group_id: Number(group_id), course_class_id: Number(course_class_id) } });
    if (!group) throw new Error('group not found or not in this course class');

    const enrolledCount = await Enrollment.count({ where: { group_id: Number(group_id), status: 'enrolled' } });
    if (enrolledCount >= group.capacity) throw new Error('Group is full');
  }

  const created = await Enrollment.create({
    student_id: Number(student_id),
    course_class_id: Number(course_class_id),
    group_id: group_id ? Number(group_id) : null,
    status: 'enrolled',
  });

  return await getEnrollment(created.enrollment_id);
};

const updateEnrollment = async (id, payload = {}) => {
  if (!id) throw new Error('Missing enrollment id');
  const row = await Enrollment.findOne({ where: { enrollment_id: id } });
  if (!row) throw new Error('Enrollment not found');

  const updateFields = {};
  ['group_id', 'status'].forEach(k => {
    if (Object.prototype.hasOwnProperty.call(payload, k)) updateFields[k] = payload[k];
  });

  // If changing group, check capacity
  if (updateFields.group_id !== undefined && updateFields.group_id !== null) {
    const group = await Group.findOne({ where: { group_id: Number(updateFields.group_id), course_class_id: row.course_class_id } });
    if (!group) throw new Error('group not found or not in this course class');

    const enrolledCount = await Enrollment.count({ where: { group_id: Number(updateFields.group_id), status: 'enrolled', enrollment_id: { [Op.ne]: id } } });
    if (enrolledCount >= group.capacity) throw new Error('Group is full');
  }

  await Enrollment.update(updateFields, { where: { enrollment_id: id } });
  return await getEnrollment(id);
};

const dropEnrollment = async (id) => {
  if (!id) throw new Error('Missing enrollment id');
  const row = await Enrollment.findOne({ where: { enrollment_id: id } });
  if (!row) throw new Error('Enrollment not found');

  await Enrollment.destroy({ where: { enrollment_id: id } });
  return { message: 'Enrollment dropped and deleted', enrollment_id: id };
};

const deleteEnrollment = async (id) => {
  if (!id) throw new Error('Missing enrollment id');
  const row = await Enrollment.findOne({ where: { enrollment_id: id } });
  if (!row) throw new Error('Enrollment not found');

  await Enrollment.destroy({ where: { enrollment_id: id } });
  return { message: 'Deleted', enrollment_id: id };
};

module.exports = { listEnrollments, getEnrollment, enrollStudent, updateEnrollment, dropEnrollment, deleteEnrollment };