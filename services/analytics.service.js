const { models } = require('../models/index.model');
const { Submission, SubmissionDetail, Question } = models;
const { Op } = require('sequelize');

const getStudentAnalytics = async (student_id) => {
  // 1. Lấy toàn bộ lịch sử làm bài của sinh viên
  const details = await SubmissionDetail.findAll({
    include: [
      { 
        model: Submission, 
        where: { student_id },
        attributes: ['submitted_at']
      },
      {
        model: Question,
        attributes: ['question_id', 'max_score', 'skill_tags'] // Lấy max_score và skill để tính toán
      }
    ],
    order: [[Submission, 'submitted_at', 'DESC']] // Lấy bài mới nhất trước
  });

  const skillStats = {}; // { "OOP": { earned: 8, total: 10, count: 2 }, ... }
  const errorCounts = {}; // { "Sai cú pháp": 5, ... }

  // 2. Duyệt qua từng câu trả lời để tính toán
  details.forEach(det => {
    // --- A. Thống kê tần suất lỗi ---
    const errors = det.ai_error_tags || [];
    if (Array.isArray(errors)) {
      errors.forEach(err => {
        errorCounts[err] = (errorCounts[err] || 0) + 1;
      });
    }

    // --- B. Tính toán độ thạo kỹ năng (Knowledge Tracing) ---
    // skill_tags có thể là mảng ["OOP", "Java"] hoặc null
    const skills = det.Question?.skill_tags || []; 
    
    // Điểm đạt được của câu này
    const score = det.final_score || det.ai_score || 0;
    // Điểm tối đa của câu này (Lấy từ Question, fallback là 10 nếu thiếu)
    const maxScore = det.Question?.max_score || 10;

    if (Array.isArray(skills)) {
      skills.forEach(skill => {
        if (!skillStats[skill]) {
          skillStats[skill] = { earned: 0, total: 0, question_count: 0 };
        }
        skillStats[skill].earned += score;
        skillStats[skill].total += maxScore;
        skillStats[skill].question_count += 1;
      });
    }
  });

  // 3. Chuẩn hóa dữ liệu Skill để trả về Frontend (dạng mảng cho dễ vẽ biểu đồ)
  // Công thức: Mastery % = (Điểm đạt / Tổng điểm tối đa) * 100
  const skillsAnalysis = Object.keys(skillStats).map(skill => {
    const stat = skillStats[skill];
    const mastery = stat.total === 0 ? 0 : Math.round((stat.earned / stat.total) * 100);
    
    // Đánh giá sơ bộ
    let level = 'Yếu';
    if (mastery >= 80) level = 'Giỏi';
    else if (mastery >= 50) level = 'Khá';

    return {
      skill_name: skill,
      mastery_percentage: mastery, // 0 - 100
      level,
      questions_attempted: stat.question_count
    };
  });

  // 4. Lấy Top 5 lỗi thường gặp nhất
  const topErrors = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1]) // Sắp xếp giảm dần theo số lần gặp
    .slice(0, 5)
    .map(([err, count]) => ({ error: err, count }));

  return {
    student_id,
    total_submissions: details.length,
    skills_radar: skillsAnalysis, // Dùng để vẽ biểu đồ Radar/Cột
    common_mistakes: topErrors,   // Dùng để hiển thị danh sách cảnh báo
    recommendation: skillsAnalysis.length > 0 
      ? `Bạn cần ôn tập thêm về: ${skillsAnalysis.filter(s => s.mastery_percentage < 65).map(s => s.skill_name).join(', ')}`
      : "Chưa có đủ dữ liệu để đánh giá."
  };
};

module.exports = { getStudentAnalytics };