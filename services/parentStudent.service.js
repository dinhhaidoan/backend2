const { sequelize, models } = require('../models/index.model');
const { ParentStudent, Student } = models;

const listParents = async ({ student_id } = {}) => {
  const where = {};
  if (student_id) where.student_id = Number(student_id);
  const items = await ParentStudent.findAll({ where });
  return items;
};

const getParent = async (id) => {
  if (!id) throw new Error('Missing parent id');
  const row = await ParentStudent.findOne({ where: { parent_student_id: id } });
  if (!row) throw new Error('Parent not found');
  return row;
};

const createParent = async (payload = {}) => {
  const { student_id, parent_name, parent_relationship, parent_contact } = payload;
  if (!student_id) throw new Error('student_id is required');
  if (!parent_name) throw new Error('parent_name is required');
  if (!parent_relationship) throw new Error('parent_relationship is required');

  const student = await Student.findOne({ where: { student_id: Number(student_id) } });
  if (!student) throw new Error('Student not found');

  const created = await ParentStudent.create({ student_id: Number(student_id), parent_name, parent_relationship, parent_contact: parent_contact || null });
  return created;
};

const updateParent = async (id, payload = {}) => {
  if (!id) throw new Error('Missing parent id');
  const row = await ParentStudent.findOne({ where: { parent_student_id: id } });
  if (!row) throw new Error('Parent not found');

  const updateFields = {};
  ['parent_name','parent_relationship','parent_contact'].forEach(k => {
    if (Object.prototype.hasOwnProperty.call(payload, k)) updateFields[k] = payload[k];
  });

  await ParentStudent.update(updateFields, { where: { parent_student_id: id } });
  return await ParentStudent.findOne({ where: { parent_student_id: id } });
};

const deleteParent = async (id) => {
  if (!id) throw new Error('Missing parent id');
  const row = await ParentStudent.findOne({ where: { parent_student_id: id } });
  if (!row) throw new Error('Parent not found');
  await ParentStudent.destroy({ where: { parent_student_id: id } });
  return { message: 'Deleted' };
};

module.exports = { listParents, getParent, createParent, updateParent, deleteParent };
