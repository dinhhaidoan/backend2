const assignmentService = require('../services/assignment.service');

exports.create = async (req, res) => {
  try {
    // Payload nhận từ FE: { course_class_id, title, questions: [{content, type: 'essay', max_score}] }
    const result = await assignmentService.createAssignmentWithQuestions(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await assignmentService.getAssignmentDetails(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};