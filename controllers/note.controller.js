const { createNote, getNotes, getNoteById, updateNote, deleteNote, getCategoriesSummary } = require('../services/note.service');

exports.create = async (req, res) => {
  try {
    const payload = req.body || {};
    // accept user_code via body or query
    if (!payload.user_code && req.query.user_code) payload.user_code = req.query.user_code;
    const note = await createNote(payload);
    res.status(201).json({ note });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const params = Object.assign({}, req.query || {});
    // normalize booleans
    if (params.favorite !== undefined) params.favorite = params.favorite === 'true' || params.favorite === true;
    if (params.archived !== undefined) params.archived = params.archived === 'true' || params.archived === true;
    const notes = await getNotes(params);
    res.json(notes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.categoriesSummary = async (req, res) => {
  try {
    const params = Object.assign({}, req.query || {});
    const data = await getCategoriesSummary(params);
    res.json({ categories: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const { note_id } = req.params;
    const note = await getNoteById(note_id);
    res.json({ note });
  } catch (err) {
    if (err.message === 'Note not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { note_id } = req.params;
    const payload = req.body || {};
    const note = await updateNote(note_id, payload);
    res.json({ message: 'Cập nhật note thành công', note });
  } catch (err) {
    if (err.message === 'Note not found') return res.status(404).json({ error: err.message });
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { note_id } = req.params;
    const result = await deleteNote(note_id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
