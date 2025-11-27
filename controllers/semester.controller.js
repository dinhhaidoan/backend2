const { listSemesters, getSemester, createSemester, updateSemester, deleteSemester } = require('../services/semester.service');

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, q = '', academic_year_id } = req.query;
    const result = await listSemesters({ page, limit, q, academic_year_id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await getSemester(id);
    res.json({ semester: row });
  } catch (err) {
    if (err.message === 'Semester not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const created = await createSemester(req.body);
    res.status(201).json({ message: 'Semester created', semester: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateSemester(id, req.body);
    res.json({ message: 'Semester updated', semester: updated });
  } catch (err) {
    if (err.message === 'Semester not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const out = await deleteSemester(id);
    res.json(out);
  } catch (err) {
    if (err.message === 'Semester not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};
