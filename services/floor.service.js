const { models } = require('../models/index.model');
const { Floor, Base } = models;

exports.listFloors = async (filters = {}) => {
  const where = {};
  // Accept either base_id (numeric) or base_code (string like 'L')
  if (filters.base_id) where.base_id = filters.base_id;
  if (filters.base_code && !where.base_id) {
    const base = await Base.findOne({ where: { base_code: filters.base_code } });
    if (base) where.base_id = base.base_id;
  }

  return await Floor.findAll({
    where,
    attributes: ['floor_id', 'base_id', 'floor_number', 'floor_name'],
    order: [['floor_number', 'ASC']],
    include: [{ model: Base, attributes: ['base_id', 'base_code', 'base_name'] }]
  });
};

exports.getFloor = async (id) => {
  const f = await Floor.findByPk(id);
  if (!f) throw new Error('Floor not found');
  return f;
};
