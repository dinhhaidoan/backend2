const { sequelize, models } = require('../models/index.model');
const { Semester } = models;

const listSemesters = async ({ page = 1, limit = 20, q = '' } = {}) => {
  const offset = Math.max(0, (Number(page) - 1)) * Number(limit);
  const where = {};
  if (q && q.trim()) {
    where.semester_name = { [require('sequelize').Op.like]: `%${q.trim()}%` };
  }
  // No academic_year filter — semesters are standalone

  const result = await Semester.findAndCountAll({ where, limit: Number(limit), offset, order: [['semester_id', 'DESC']] });
  return {
    items: result.rows,
    total: result.count,
    page: Number(page),
    limit: Number(limit),
    lastPage: Math.ceil(result.count / Number(limit) || 1),
  };
};

const getSemester = async (id) => {
  if (!id) throw new Error('Missing semester id');
  const row = await Semester.findOne({ where: { semester_id: id } });
  if (!row) throw new Error('Semester not found');
  return row;
};

const createSemester = async (payload = {}) => {
  const { semester_name, semester_start, semester_end, max_credits } = payload;
  if (!semester_name) throw new Error('semester_name is required');
  if (!semester_start || !semester_end) throw new Error('semester_start and semester_end are required');
  const created = await Semester.create({ semester_name, semester_start, semester_end, max_credits: Number(max_credits) || 0 });
  return created;
};

const updateSemester = async (id, payload = {}) => {
  if (!id) throw new Error('Missing semester id');
  const row = await Semester.findOne({ where: { semester_id: id } });
  if (!row) throw new Error('Semester not found');
  const updateFields = {};
  ['semester_name','semester_start','semester_end','max_credits'].forEach(k => {
    if (Object.prototype.hasOwnProperty.call(payload, k)) updateFields[k] = payload[k];
  });
  if (updateFields.max_credits !== undefined) updateFields.max_credits = Number(updateFields.max_credits) || 0;
  await Semester.update(updateFields, { where: { semester_id: id } });
  return await Semester.findOne({ where: { semester_id: id } });
};

const deleteSemester = async (id) => {
  if (!id) throw new Error('Missing semester id');
  const row = await Semester.findOne({ where: { semester_id: id } });
  if (!row) throw new Error('Semester not found');
  await Semester.destroy({ where: { semester_id: id } });
  return { message: 'Deleted' };
};

module.exports = { listSemesters, getSemester, createSemester, updateSemester, deleteSemester };
