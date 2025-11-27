const { models } = require('../models/index.model');
const { Base } = models;

exports.listBases = async () => {
  return await Base.findAll({ attributes: ['base_id', 'base_code', 'base_name'], order: [['base_code', 'ASC']] });
};

exports.getBase = async (id) => {
  const base = await Base.findByPk(id, { attributes: ['base_id', 'base_code', 'base_name'] });
  if (!base) throw new Error('Base not found');
  return base;
};
