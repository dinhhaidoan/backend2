const { sequelize, models } = require('../models/index.model');
const { Course, CourseMajor, CoursePrerequisite, Major, Semester } = models;
const { Op } = require('sequelize');

const listCourses = async ({ page = 1, limit = 20, q = '' } = {}) => {
  const offset = Math.max(0, (Number(page) - 1)) * Number(limit);
  const where = {};
  if (q && q.trim()) {
    const s = `%${q.trim()}%`;
    where[Op.or] = [
      { course_SKU: { [Op.like]: s } },
      { course_name_vn: { [Op.like]: s } },
      { course_name_en: { [Op.like]: s } },
    ];
  }

  const result = await Course.findAndCountAll({
    where,
    include: [ { model: Semester }, { model: Major }, { model: Course, as: 'Prerequisites' } ],
    limit: Number(limit),
    offset,
    order: [['course_id', 'DESC']],
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

const getCourse = async (id) => {
  if (!id) throw new Error('Missing course_id');
  const row = await Course.findOne({ where: { course_id: id }, include: [ { model: Semester }, { model: Major }, { model: Course, as: 'Prerequisites' } ] });
  if (!row) throw new Error('Course not found');
  return row;
};

const createCourse = async (payload = {}) => {
  let {
    course_SKU,
    course_name_vn,
    course_name_en,
    credits,
    course_type,
    semester_id,
    description,
    major_ids = [],
    prerequisite_ids = [],
  } = payload;

  if (!course_SKU) throw new Error('course_SKU is required');
  if (!course_name_vn) throw new Error('course_name_vn is required');
  // check SKU uniqueness
  const exists = await Course.findOne({ where: { course_SKU } });
  if (exists) throw new Error('course_SKU already exists');

  // If semester_id provided, ensure it exists
  if (semester_id !== undefined && semester_id !== null && String(semester_id).trim() !== '') {
    const sem = await Semester.findOne({ where: { semester_id: Number(semester_id) } });
    if (!sem) throw new Error('semester_id not found');
  }

  // Ensure majors exist (dedupe inputs first)
  if (Array.isArray(major_ids) && major_ids.length > 0) {
    const majIds = Array.from(new Set(major_ids.map(x => Number(x))));
    if (majIds.length === 0) throw new Error('major_ids must contain at least one valid id');
    const m = await Major.findAll({ where: { major_id: { [Op.in]: majIds } } });
    if (m.length !== majIds.length) throw new Error('One or more majors not found');
    // use deduped list
    major_ids = majIds;
  }

  // Ensure prerequisites exist (prerequisite_ids should be course ids) and dedupe
  if (Array.isArray(prerequisite_ids) && prerequisite_ids.length > 0) {
    const pIds = Array.from(new Set(prerequisite_ids.map(x => Number(x))));
    if (pIds.includes(Number(null))) throw new Error('Invalid prerequisite id');
    const pr = await Course.findAll({ where: { course_id: { [Op.in]: pIds } } });
    if (pr.length !== pIds.length) throw new Error('One or more prerequisite courses not found');
    prerequisite_ids = pIds;
  }

  const created = await Course.create({ course_SKU, course_name_vn, course_name_en, credits: Number(credits || 3), course_type: course_type || 'required', semester_id: semester_id ? Number(semester_id) : null, description });

  // relate majors
  if (Array.isArray(major_ids) && major_ids.length > 0) {
    const bulk = major_ids.map(mid => ({ course_id: created.course_id, major_id: Number(mid) }));
    await CourseMajor.bulkCreate(bulk);
  }

  // relate prerequisites
  if (Array.isArray(prerequisite_ids) && prerequisite_ids.length > 0) {
    const bulk = prerequisite_ids.map(pid => ({ course_id: created.course_id, prereq_course_id: Number(pid) }));
    await CoursePrerequisite.bulkCreate(bulk);
  }

  return await getCourse(created.course_id);
};

const updateCourse = async (id, payload = {}) => {
  if (!id) throw new Error('Missing course_id');
  const row = await Course.findOne({ where: { course_id: id } });
  if (!row) throw new Error('Course not found');

  const updateFields = {};
  ['course_SKU','course_name_vn','course_name_en','credits','course_type','semester_id','description'].forEach(k => {
    if (Object.prototype.hasOwnProperty.call(payload, k)) updateFields[k] = payload[k];
  });

  // If SKU changed, ensure uniqueness
  if (updateFields.course_SKU) {
    const e = await Course.findOne({ where: { course_SKU: updateFields.course_SKU, course_id: { [Op.ne]: id } } });
    if (e) throw new Error('course_SKU already exists');
  }

  await Course.update(updateFields, { where: { course_id: id } });

  // handle majors: optional array in payload: major_ids (dedupe and verify)
  if (Object.prototype.hasOwnProperty.call(payload, 'major_ids')) {
    let major_ids = payload.major_ids || [];
    if (!Array.isArray(major_ids)) throw new Error('major_ids must be an array');
    major_ids = Array.from(new Set(major_ids.map(x => Number(x))));
    if (major_ids.length > 0) {
      const m = await Major.findAll({ where: { major_id: { [Op.in]: major_ids } } });
      if (m.length !== major_ids.length) throw new Error('One or more majors not found');
    }
    // replace: delete existing and add new
    await CourseMajor.destroy({ where: { course_id: id } });
    if (major_ids.length > 0) {
      const bulk = major_ids.map(mid => ({ course_id: Number(id), major_id: Number(mid) }));
      await CourseMajor.bulkCreate(bulk);
    }
  }

  // handle prerequisites: optional array in payload: prerequisite_ids
  if (Object.prototype.hasOwnProperty.call(payload, 'prerequisite_ids')) {
    let prerequisite_ids = payload.prerequisite_ids || [];
    if (!Array.isArray(prerequisite_ids)) throw new Error('prerequisite_ids must be an array');
    prerequisite_ids = Array.from(new Set(prerequisite_ids.map(x => Number(x))));
    if (prerequisite_ids.includes(Number(id))) throw new Error('Course cannot be prerequisite of itself');
    if (prerequisite_ids.length > 0) {
      const pr = await Course.findAll({ where: { course_id: { [Op.in]: prerequisite_ids } } });
      if (pr.length !== prerequisite_ids.length) throw new Error('One or more prerequisite courses not found');
    }
    await CoursePrerequisite.destroy({ where: { course_id: id } });
    if (prerequisite_ids.length > 0) await CoursePrerequisite.bulkCreate(prerequisite_ids.map(pid => ({ course_id: Number(id), prereq_course_id: Number(pid) })));
  }

  return await getCourse(id);
};

const deleteCourse = async (id) => {
  if (!id) throw new Error('Missing course_id');
  const row = await Course.findOne({ where: { course_id: id } });
  if (!row) throw new Error('Course not found');
  await CourseMajor.destroy({ where: { course_id: id } });
  await CoursePrerequisite.destroy({ where: { [Op.or]: [{ course_id: id }, { prereq_course_id: id }] } });
  await Course.destroy({ where: { course_id: id } });
  return { message: 'Deleted', course_id: id };
};

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse };
