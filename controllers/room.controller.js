const { listRooms, getRoom } = require('../services/room.service');

exports.list = async (req, res) => {
  try {
    const { base_id, base_code, floor_id, floor_number } = req.query;
    const rows = await listRooms({ base_id, base_code, floor_id, floor_number });
    res.json({ rooms: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await getRoom(id);
    res.json({ room: row });
  } catch (err) {
    if (err.message === 'Room not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};
