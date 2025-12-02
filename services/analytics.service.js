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

  // Nếu chưa có dữ liệu, trả về mặc định
  if (!details || details.length === 0) {
    return {
      totalSubmissions: 0,
      avgScore: 0,
      strongestSkill: "N/A",
      weakestSkill: "N/A",
      skillBreakdown: {},
      commonErrors: []
    };
  }

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

  // 3. Chuẩn hóa dữ liệu Skill để trả về Frontend
  const skillBreakdown = {};
  let totalEarned = 0;
  let totalMax = 0;
  
  Object.keys(skillStats).forEach(skill => {
    const stat = skillStats[skill];
    const avgScore = stat.total === 0 ? 0 : (stat.earned / stat.question_count);
    const maxPossible = stat.total === 0 ? 10 : (stat.total / stat.question_count);
    
    skillBreakdown[skill] = {
      avgScore: Math.round(avgScore * 10) / 10, // Round to 1 decimal
      maxScore: Math.round(maxPossible * 10) / 10,
      count: stat.question_count
    };
    
    totalEarned += stat.earned;
    totalMax += stat.total;
  });

  // Tính điểm trung bình tổng thể
  const avgScore = totalMax === 0 ? 0 : Math.round((totalEarned / totalMax) * 10 * 10) / 10;

  // Tìm skill mạnh nhất và yếu nhất
  let strongestSkill = null;
  let weakestSkill = null;
  let highestAvg = -1;
  let lowestAvg = Infinity;

  Object.entries(skillBreakdown).forEach(([skill, data]) => {
    const percentage = data.maxScore === 0 ? 0 : (data.avgScore / data.maxScore) * 100;
    if (percentage > highestAvg) {
      highestAvg = percentage;
      strongestSkill = skill;
    }
    if (percentage < lowestAvg) {
      lowestAvg = percentage;
      weakestSkill = skill;
    }
  });

  // 4. Lấy Top 5 lỗi thường gặp nhất (format theo yêu cầu frontend)
  const commonErrors = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return {
    totalSubmissions: details.length,
    avgScore: avgScore || 0,
    strongestSkill: strongestSkill || "N/A",
    weakestSkill: weakestSkill || "N/A",
    skillBreakdown,
    commonErrors
  };
};

module.exports = { getStudentAnalytics };