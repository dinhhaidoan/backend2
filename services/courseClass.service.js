const { sequelize, models } = require('../models/index.model');
const { CourseClass, Course, Teacher, Semester, Base, Floor, Room } = models;
const { Op } = require('sequelize');

const listCourseClasses = async ({ page = 1, limit = 20, q = '', status, teacher_id, teacher_code } = {}) => {
  const offset = Math.max(0, (Number(page) - 1)) * Number(limit);
  const where = {};
  if (q && q.trim()) {
    const s = `%${q.trim()}%`;
    where[Op.or] = [
      { course_class_SKU: { [Op.like]: s } },
      { course_name_vn: { [Op.like]: s } },
    ];
  }
  if (status && String(status).trim()) {
    const allowed = ['open', 'teaching', 'closed'];
    if (allowed.includes(String(status))) where.status = String(status);
  }

  // Filter by teacher: prefer teacher_id directly; if only teacher_code provided, resolve it
  if (teacher_id !== undefined && teacher_id !== null && String(teacher_id).trim() !== '') {
    where.teacher_id = Number(teacher_id);
  } else if (teacher_code !== undefined && teacher_code !== null && String(teacher_code).trim() !== '') {
    const t = await Teacher.findOne({ where: { teacher_code: String(teacher_code) } });
    if (t) {
      where.teacher_id = t.teacher_id;
    } else {
      // No teacher found for that code — make where match nothing
      where.teacher_id = -1;
    }
  }

  const result = await CourseClass.findAndCountAll({
    where,
    include: [ { model: Course }, { model: Semester }, { model: Teacher }, { model: Base }, { model: Floor }, { model: Room } ],
    limit: Number(limit),
    offset,
    order: [['course_class_id', 'DESC']],
    distinct: true,
  });

  return {
    items: result.rows,
    total: result.count,
    page: Number(page),
    limit: Number(limit),
    lastPage: Math.ceil(result.count / Number(limit) || 1),
  };
};

const getCourseClass = async (id) => {
  if (!id) throw new Error('Missing course_class_id');
  const row = await CourseClass.findOne({ where: { course_class_id: id }, include: [ { model: Course }, { model: Semester }, { model: Teacher }, { model: Base }, { model: Floor }, { model: Room } ] });
  if (!row) throw new Error('CourseClass not found');
  return row;
};

const padSuffix = (n) => String(n).padStart(2, '0');

const createCourseClass = async (payload = {}) => {
  const { course_id, course_class_suffix, teacher_id, base_id, floor_id, room_id, capacity = 30, description, status } = payload;
  if (!course_id) throw new Error('course_id is required');

  const course = await Course.findOne({ where: { course_id: Number(course_id) } });
  if (!course) throw new Error('course not found');

  // Determine semester and credits from course if not provided separately
  const semester_id = course.semester_id || null;
  const credits = course.credits || 3;

  // Build SKU: course.course_SKU + '-' + suffix. If suffix not provided, auto-increment.
  let skuSuffix = null;
  if (course_class_suffix !== undefined && course_class_suffix !== null && String(course_class_suffix).trim() !== '') {
    skuSuffix = padSuffix(Number(course_class_suffix));
  } else {
    // auto derive next number from existing classes for that course
    const rows = await CourseClass.findAll({ where: { course_id: Number(course_id), course_class_SKU: { [Op.like]: `${course.course_SKU}-%` } }, attributes: ['course_class_SKU'] });
    let max = 0;
    for (const r of rows) {
      const s = String(r.course_class_SKU || '');
      const parts = s.split('-');
      const last = parts[parts.length - 1];
      const n = Number(last);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    skuSuffix = padSuffix(max + 1);
  }

  const course_class_SKU = `${course.course_SKU}-${skuSuffix}`;

  // Verify SKU uniqueness
  const exists = await CourseClass.findOne({ where: { course_class_SKU } });
  if (exists) throw new Error('course_class_SKU already exists');

  // If teacher provided, verify
  if (teacher_id !== undefined && teacher_id !== null && String(teacher_id).trim() !== '') {
    const t = await Teacher.findOne({ where: { teacher_id: Number(teacher_id) } });
    if (!t) throw new Error('teacher_id not found');
  }

  // If room provided, verify and infer base_id/floor_id if not provided
  // This fixes the issue where frontend sends room_id but not base_id/floor_id, causing missing data in course_class
  let inferredBaseId = base_id ? Number(base_id) : null;
  let inferredFloorId = floor_id ? Number(floor_id) : null;
  if (room_id !== undefined && room_id !== null && String(room_id).trim() !== '') {
    const r = await Room.findOne({ where: { room_id: Number(room_id) } });
    if (!r) throw new Error('room_id not found');
    // Infer base_id and floor_id from room if not provided
    if (!inferredBaseId && r.base_id) inferredBaseId = r.base_id;
    if (!inferredFloorId && r.floor_id) inferredFloorId = r.floor_id;
  }

  const allowedStatus = ['open', 'teaching', 'closed'];
  const sVal = (status && allowedStatus.includes(status)) ? status : 'open';

  const created = await CourseClass.create({
    course_class_SKU,
    course_class_suffix: skuSuffix,
    course_name_vn: course.course_name_vn,
    course_id: Number(course_id),
    semester_id: semester_id ? Number(semester_id) : null,
    teacher_id: teacher_id ? Number(teacher_id) : null,
    base_id: inferredBaseId,
    floor_id: inferredFloorId,
    room_id: room_id ? Number(room_id) : null,
    credits: Number(credits),
    capacity: Number(capacity),
    status: sVal,
    description,
  });

  return await getCourseClass(created.course_class_id);
};

const updateCourseClass = async (id, payload = {}) => {
  if (!id) throw new Error('Missing course_class id');
  const row = await CourseClass.findOne({ where: { course_class_id: id } });
  if (!row) throw new Error('CourseClass not found');

  const updateFields = {};
  ['course_class_SKU','course_class_suffix','course_name_vn','teacher_id','semester_id','base_id','floor_id','room_id','credits','capacity','description','status'].forEach(k => {
    if (Object.prototype.hasOwnProperty.call(payload, k)) updateFields[k] = payload[k];
  });

  // If course_class_SKU changed, ensure uniqueness
  if (updateFields.course_class_SKU) {
    const e = await CourseClass.findOne({ where: { course_class_SKU: updateFields.course_class_SKU, course_class_id: { [Op.ne]: id } } });
    if (e) throw new Error('course_class_SKU already exists');
  }

  // If teacher_id/room_id provided, validate and infer base_id/floor_id if room_id updated
  if (updateFields.teacher_id !== undefined && updateFields.teacher_id !== null && String(updateFields.teacher_id).trim() !== '') {
    const t = await Teacher.findOne({ where: { teacher_id: Number(updateFields.teacher_id) } });
    if (!t) throw new Error('teacher_id not found');
  }
  if (updateFields.room_id !== undefined && updateFields.room_id !== null && String(updateFields.room_id).trim() !== '') {
    const r = await Room.findOne({ where: { room_id: Number(updateFields.room_id) } });
    if (!r) throw new Error('room_id not found');
    // Infer base_id and floor_id from room if not provided in update
    if (!updateFields.base_id && r.base_id) updateFields.base_id = r.base_id;
    if (!updateFields.floor_id && r.floor_id) updateFields.floor_id = r.floor_id;
  }
  if (Object.prototype.hasOwnProperty.call(updateFields, 'status')) {
    const allowedStatus = ['open', 'teaching', 'closed'];
    if (!allowedStatus.includes(String(updateFields.status))) throw new Error(`status must be one of ${allowedStatus.join(', ')}`);
  }

  await CourseClass.update(updateFields, { where: { course_class_id: id } });
  return await getCourseClass(id);
};

const deleteCourseClass = async (id) => {
  if (!id) throw new Error('Missing course_class id');
  const row = await CourseClass.findOne({ where: { course_class_id: id } });
  if (!row) throw new Error('CourseClass not found');

  // TODO: prevent deletion if there are linked enrollments
  await CourseClass.destroy({ where: { course_class_id: id } });
  return { message: 'Deleted', course_class_id: id };
};

module.exports = { listCourseClasses, getCourseClass, createCourseClass, updateCourseClass, deleteCourseClass };
