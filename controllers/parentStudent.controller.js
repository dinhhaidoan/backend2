const { listParents, getParent, createParent, updateParent, deleteParent } = require('../services/parentStudent.service');

exports.list = async (req, res) => {
  try {
    const { student_id } = req.query;
    const items = await listParents({ student_id });
    res.json({ items });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getParent(Number(id));
    res.json({ item });
  } catch (err) {
    if (err.message === 'Parent not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = Object.assign({}, req.body);
    // Allow student_id via url param if present
    if (req.params && req.params.student_id) payload.student_id = Number(req.params.student_id);
    const created = await createParent(payload);
    res.status(201).json({ item: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateParent(Number(id), req.body);
    res.json({ item: updated });
  } catch (err) {
    if (err.message === 'Parent not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteParent(Number(id));
    res.json(result);
  } catch (err) {
    if (err.message === 'Parent not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};
