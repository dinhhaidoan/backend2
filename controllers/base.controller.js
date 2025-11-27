const { listBases, getBase } = require('../services/base.service');

exports.list = async (req, res) => {
  try {
    const rows = await listBases();
    res.json({ bases: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await getBase(id);
    res.json({ base: row });
  } catch (err) {
    if (err.message === 'Base not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};
