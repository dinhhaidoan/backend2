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

exports.getAll = async (req, res) => {
  try {
    const filters = {
      course_class_id: req.query.course_class_id
    };
    const result = await assignmentService.getAllAssignments(filters);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await assignmentService.deleteAssignment(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// controllers/assignment.controller.js

exports.autoCreate = async (req, res) => {
  try {
    const { course_class_id, topic, difficulty, quantity, type, title, mix_options, due_date } = req.body;
    
    // Validate cơ bản
    if (!topic || !course_class_id) return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });

    const result = await assignmentService.autoGenerateAssignment({ 
      course_class_id, topic, difficulty, quantity, type, title, mix_options, due_date 
    });

    res.status(201).json({ 
      message: "Tạo bài tập tự động thành công! Vui lòng kiểm tra và xuất bản.", 
      result 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};