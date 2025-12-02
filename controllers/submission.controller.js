const submissionService = require('../services/submission.service');

exports.submit = async (req, res) => {
  try {
    const result = await submissionService.submitAndGrade(req.body);
    res.status(201).json({ 
      message: "Nộp bài và chấm điểm thành công!", 
      result 
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const filters = {
      student_id: req.query.student_id,
      assignment_id: req.query.assignment_id
    };
    const result = await submissionService.getAllSubmissions(filters);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await submissionService.getSubmissionById(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateGrade = async (req, res) => {
  try {
    const { detail_id } = req.params; // Lấy ID từ URL
    const { score, note } = req.body; // Lấy điểm mới và ghi chú từ Body

    if (score === undefined) return res.status(400).json({ error: "Thiếu điểm số (score)" });

    const result = await submissionService.updateDetailScore(detail_id, score, note);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};