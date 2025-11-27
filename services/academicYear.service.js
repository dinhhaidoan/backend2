const { sequelize, models } = require('../models/index.model');
const { AcademicYear, Student, OfficeClass } = models;
const { Op } = require('sequelize');

const listAcademicYears = async ({ page = 1, limit = 20, q = '' } = {}) => {
  const offset = Math.max(0, (Number(page) - 1)) * Number(limit);
  const where = {};
  if (q && q.trim()) where.academic_year_name = { [Op.like]: `%${q.trim()}%` };

  const result = await AcademicYear.findAndCountAll({ where, limit: Number(limit), offset, order: [['academic_year_id', 'DESC']] });
  return { items: result.rows, total: result.count, page: Number(page), limit: Number(limit), lastPage: Math.ceil(result.count / Number(limit) || 1) };
};

const getAcademicYear = async (id) => {
  if (!id) throw new Error('Missing academic_year_id');
  const row = await AcademicYear.findOne({ where: { academic_year_id: id } });
  if (!row) throw new Error('AcademicYear not found');
  return row;
};

const createAcademicYear = async ({ academic_year_name, academic_year_start, academic_year_end }) => {
  if (!academic_year_name) throw new Error('academic_year_name is required');
  if (academic_year_start === undefined || academic_year_end === undefined) throw new Error('academic_year_start and academic_year_end are required');
  if (Number(academic_year_end) < Number(academic_year_start)) throw new Error('academic_year_end must be greater or equal to academic_year_start');

  const existing = await AcademicYear.findOne({ where: { academic_year_name } });
  if (existing) throw new Error('academic_year_name already exists');

  const created = await AcademicYear.create({ academic_year_name, academic_year_start: Number(academic_year_start), academic_year_end: Number(academic_year_end) });
  return created;
};

const updateAcademicYear = async (id, payload = {}) => {
  if (!id) throw new Error('Missing academic_year_id');
  const row = await AcademicYear.findOne({ where: { academic_year_id: id } });
  if (!row) throw new Error('AcademicYear not found');

  const { academic_year_name, academic_year_start, academic_year_end } = payload;
  const updateData = {};
  if (academic_year_name !== undefined) updateData.academic_year_name = academic_year_name;
  if (academic_year_start !== undefined) updateData.academic_year_start = Number(academic_year_start);
  if (academic_year_end !== undefined) updateData.academic_year_end = Number(academic_year_end);

  if (updateData.academic_year_start !== undefined && updateData.academic_year_end !== undefined) {
    if (updateData.academic_year_end < updateData.academic_year_start) throw new Error('academic_year_end must be >= academic_year_start');
  }

  if (updateData.academic_year_name) {
    const dup = await AcademicYear.findOne({ where: { academic_year_name: updateData.academic_year_name, academic_year_id: { [Op.ne]: id } } });
    if (dup) throw new Error('academic_year_name already exists');
  }

  await AcademicYear.update(updateData, { where: { academic_year_id: id } });
  const updated = await AcademicYear.findOne({ where: { academic_year_id: id } });
  return updated;
};

const deleteAcademicYear = async (id) => {
  if (!id) throw new Error('Missing academic_year_id');
  const row = await AcademicYear.findOne({ where: { academic_year_id: id } });
  if (!row) throw new Error('AcademicYear not found');

  const studentCount = await Student.count({ where: { academic_year_id: id } });
  const officeCount = await OfficeClass.count({ where: { academic_year_id: id } });
  if (studentCount > 0 || officeCount > 0) {
    throw new Error('Cannot delete academic year: there are students or classes linked to this year');
  }

  await AcademicYear.destroy({ where: { academic_year_id: id } });
  return { message: 'AcademicYear deleted', academic_year_id: id };
};

module.exports = { listAcademicYears, getAcademicYear, createAcademicYear, updateAcademicYear, deleteAcademicYear };