const { models } = require('../models/index.model');
const { Room, Floor, Base } = models;

exports.listRooms = async (filters = {}) => {
  const where = {};
  // Accept base_id or base_code
  if (filters.base_id) where.base_id = filters.base_id;
  if (filters.base_code && !where.base_id) {
    const base = await Base.findOne({ where: { base_code: filters.base_code } });
    if (base) where.base_id = base.base_id;
  }
  // Accept floor_id or floor_number (+ optional base)
  if (filters.floor_id) where.floor_id = filters.floor_id;
  if (filters.floor_number && !where.floor_id) {
    const flWhere = { floor_number: filters.floor_number };
    if (where.base_id) flWhere.base_id = where.base_id;
    const floor = await Floor.findOne({ where: flWhere });
    if (floor) where.floor_id = floor.floor_id;
  }

  return await Room.findAll({
    where,
    attributes: ['room_id', 'base_id', 'floor_id', 'room_number', 'room_code', 'room_name'],
    order: [['room_number', 'ASC']],
    include: [
      { model: Floor, attributes: ['floor_id', 'floor_number', 'floor_name'] },
      { model: Base, attributes: ['base_id', 'base_code', 'base_name'] }
    ]
  });
};

exports.getRoom = async (id) => {
  const r = await Room.findByPk(id);
  if (!r) throw new Error('Room not found');
  return r;
};
