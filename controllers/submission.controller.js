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