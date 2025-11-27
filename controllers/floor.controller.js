const { listFloors, getFloor } = require('../services/floor.service');

exports.list = async (req, res) => {
  try {
    const { base_id, base_code } = req.query;
    const rows = await listFloors({ base_id, base_code });
    res.json({ floors: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await getFloor(id);
    res.json({ floor: row });
  } catch (err) {
    if (err.message === 'Floor not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};
