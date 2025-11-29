const { sequelize, models } = require('../models/index.model');
const { Group, CourseClass, Enrollment } = models;
const { Op } = require('sequelize');

const listGroups = async ({ course_class_id, page = 1, limit = 20 } = {}) => {
  const offset = Math.max(0, (Number(page) - 1)) * Number(limit);
  const where = {};
  if (course_class_id) where.course_class_id = Number(course_class_id);

  const result = await Group.findAndCountAll({
    where,
    include: [ { model: CourseClass } ],
    limit: Number(limit),
    offset,
    order: [['group_id', 'DESC']],
  });

  return {
    items: result.rows,
    total: result.count,
    page: Number(page),
    limit: Number(limit),
    lastPage: Math.ceil(result.count / Number(limit) || 1),
  };
};

const getGroup = async (id) => {
  if (!id) throw new Error('Missing group_id');
  const row = await Group.findOne({ where: { group_id: id }, include: [ { model: CourseClass }, { model: Enrollment, include: [{ model: models.Student }] } ] });
  if (!row) throw new Error('Group not found');
  return row;
};

const createGroup = async (payload = {}) => {
  const { course_class_id, group_name, capacity = 20 } = payload;
  if (!course_class_id) throw new Error('course_class_id is required');
  if (!group_name) throw new Error('group_name is required');

  const courseClass = await CourseClass.findOne({ where: { course_class_id: Number(course_class_id) } });
  if (!courseClass) throw new Error('course_class not found');

  const created = await Group.create({ course_class_id: Number(course_class_id), group_name, capacity: Number(capacity) });
  return await getGroup(created.group_id);
};

const updateGroup = async (id, payload = {}) => {
  if (!id) throw new Error('Missing group id');
  const row = await Group.findOne({ where: { group_id: id } });
  if (!row) throw new Error('Group not found');

  const updateFields = {};
  ['group_name', 'capacity'].forEach(k => {
    if (Object.prototype.hasOwnProperty.call(payload, k)) updateFields[k] = payload[k];
  });

  await Group.update(updateFields, { where: { group_id: id } });
  return await getGroup(id);
};

const deleteGroup = async (id) => {
  if (!id) throw new Error('Missing group id');
  const row = await Group.findOne({ where: { group_id: id } });
  if (!row) throw new Error('Group not found');

  // Prevent delete if enrollments exist
  const enrollmentsCount = await Enrollment.count({ where: { group_id: id } });
  if (enrollmentsCount > 0) throw new Error('Cannot delete: enrollments exist');

  await Group.destroy({ where: { group_id: id } });
  return { message: 'Deleted', group_id: id };
};

module.exports = { listGroups, getGroup, createGroup, updateGroup, deleteGroup };