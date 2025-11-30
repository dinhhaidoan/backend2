const { sequelize, models } = require('../models/index.model');
const { OfficeClass, Teacher, AcademicYear, Student, Major } = models;
const { Op } = require('sequelize');

const listOfficeClasses = async ({ page = 1, limit = 20, q = '' } = {}) => {
  const offset = Math.max(0, (Number(page) - 1)) * Number(limit);
  const where = {};
  if (q && q.trim()) {
    const s = `%${q.trim()}%`;
    where[Op.or] = [
      { office_class_SKU: { [Op.like]: s } },
      { office_class_name: { [Op.like]: s } },
    ];
  }

  const result = await OfficeClass.findAndCountAll({
    where,
    include: [ { model: Teacher }, { model: AcademicYear }, { model: Major } ],
    limit: Number(limit),
    offset,
    order: [['office_class_id','DESC']],
  });

  return {
    items: result.rows,
    total: result.count,
    page: Number(page),
    limit: Number(limit),
    lastPage: Math.ceil(result.count / Number(limit) || 1),
  };
};

const getOfficeClass = async (id) => {
  if (!id) throw new Error('Missing office_class id');
  const row = await OfficeClass.findOne({ where: { office_class_id: id }, include: [ { model: Teacher }, { model: AcademicYear }, { model: Major } ] });
  if (!row) throw new Error('OfficeClass not found');
  return row;
};

const createOfficeClass = async (payload = {}) => {
  const { office_class_SKU, office_class_name, teacher_id, academic_year_id, major_id } = payload;
  if (!office_class_SKU) throw new Error('office_class_SKU is required');
  if (!office_class_name) throw new Error('office_class_name is required');
  if (!teacher_id) throw new Error('teacher_id is required');
  if (!academic_year_id) throw new Error('academic_year_id is required');

  // Ensure unique SKU
  const exists = await OfficeClass.findOne({ where: { office_class_SKU } });
  if (exists) throw new Error('office_class_SKU already exists');

  // If major_id provided, ensure it exists
  let majVal = null;
  if (major_id !== undefined && major_id !== null && String(major_id).trim() !== '') {
    const maj = await Major.findOne({ where: { major_id: Number(major_id) } });
    if (!maj) throw new Error('major_id not found');
    majVal = Number(major_id);
  }

  const created = await OfficeClass.create({ office_class_SKU, office_class_name, teacher_id: Number(teacher_id), academic_year_id: Number(academic_year_id), major_id: majVal });
  return created;
};

const updateOfficeClass = async (id, payload = {}) => {
  if (!id) throw new Error('Missing office_class id');
  const row = await OfficeClass.findOne({ where: { office_class_id: id } });
  if (!row) throw new Error('OfficeClass not found');

  const updateFields = {};
  ['office_class_SKU','office_class_name','teacher_id','academic_year_id','major_id'].forEach(k => {
    if (Object.prototype.hasOwnProperty.call(payload, k)) updateFields[k] = payload[k];
  });

  // If SKU changed, ensure uniqueness
  if (updateFields.office_class_SKU) {
    const e = await OfficeClass.findOne({ where: { office_class_SKU: updateFields.office_class_SKU, office_class_id: { [Op.ne]: id } } });
    if (e) throw new Error('office_class_SKU already exists');
  }

  // If major_id provided in update, verify existence (allow null to clear)
  if (Object.prototype.hasOwnProperty.call(updateFields, 'major_id')) {
    const mv = updateFields.major_id;
    if (mv === null || mv === undefined || String(mv).trim() === '') {
      updateFields.major_id = null;
    } else {
      const maj = await Major.findOne({ where: { major_id: Number(mv) } });
      if (!maj) throw new Error('major_id not found');
      updateFields.major_id = Number(mv);
    }
  }

  await OfficeClass.update(updateFields, { where: { office_class_id: id } });
  return await OfficeClass.findOne({ where: { office_class_id: id }, include: [ { model: Teacher }, { model: AcademicYear }, { model: Major } ] });
};

const deleteOfficeClass = async (id) => {
  if (!id) throw new Error('Missing office_class id');
  const row = await OfficeClass.findOne({ where: { office_class_id: id } });
  if (!row) throw new Error('OfficeClass not found');

  // If students exist, set their office_class_id to null then remove office class
  const transaction = await sequelize.transaction();
  try {
    await Student.update({ office_class_id: null }, { where: { office_class_id: id }, transaction: transaction });
    await OfficeClass.destroy({ where: { office_class_id: id }, transaction: transaction });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
  return { message: 'Deleted' };
};

module.exports = { listOfficeClasses, getOfficeClass, createOfficeClass, updateOfficeClass, deleteOfficeClass };
