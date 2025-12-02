const analyticsService = require('../services/analytics.service');
const { models } = require('../models/index.model');
const { Student } = models;

exports.getStudentReport = async (req, res) => {
  try {
    // Lấy student_id từ query param
    let { student_id } = req.query;
    
    if (!student_id) {
      return res.status(400).json({ error: "Missing student_id" });
    }

    student_id = Number(student_id);
    if (isNaN(student_id) || student_id <= 0) {
      return res.status(400).json({ error: "Invalid student_id" });
    }

    // Kiểm tra quyền hạn:
    // - Sinh viên chỉ xem được của mình
    // - GV/Admin có thể xem của bất kỳ sinh viên nào
    const currentUserId = req.user?.id;
    const currentRoleId = req.user?.role_id;

    if (!currentUserId || !currentRoleId) {
      return res.status(401).json({ error: "Unauthorized: missing user info" });
    }

    // Kiểm tra xem user hiện tại có phải là sinh viên này không
    if (currentRoleId === 3) { // role_id 3 = Student (cần kiểm tra với DB)
      // Lấy student_id của user hiện tại
      const currentStudent = await Student.findOne({
        where: { user_id: currentUserId }
      });

      if (!currentStudent || currentStudent.student_id !== student_id) {
        return res.status(403).json({ error: "Forbidden: you can only view your own analytics" });
      }
    }
    // Nếu không phải sinh viên (GV/Admin), cho phép xem

    // Kiểm tra sinh viên có tồn tại không
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const report = await analyticsService.getStudentAnalytics(student_id);
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};