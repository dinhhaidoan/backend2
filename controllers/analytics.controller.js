const analyticsService = require('../services/analytics.service');

exports.getStudentReport = async (req, res) => {
  try {
    // Lấy student_id từ query param (nếu GV xem) hoặc từ token (nếu SV xem)
    // Ở đây mình demo đơn giản lấy từ query ?student_id=1
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ error: "Missing student_id" });
    }

    const report = await analyticsService.getStudentAnalytics(student_id);
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};