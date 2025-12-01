const { sequelize, models } = require('../models/index.model');
const { Assignment, Question } = models;
const { generateRubric, analyzeMCQ, generateTestCases } = require('./ai.service');

const createAssignmentWithQuestions = async (data) => {
  const { course_class_id, title, description, questions } = data;

  return await sequelize.transaction(async (t) => {
    // 1. Tạo Assignment
    const newAssignment = await Assignment.create({
      course_class_id,
      title,
      description,
      status: 'published'
    }, { transaction: t });

    // 2. Xử lý từng câu hỏi
    if (questions && questions.length > 0) {
      for (const q of questions) {
        // KHAI BÁO BIẾN Ở ĐÂY ĐỂ TRÁNH LỖI "NOT DEFINED"
        let rubric = null;
        let skills = null; // Mặc định là null
        let mcqOptions = null;
        let mcqCorrectIndex = null;
        let codeTestCases = null; // Biến mới
        let codeLang = null;      // Biến mới

        // Chỉ gọi AI nếu là câu tự luận (essay)
        if (q.type === 'essay') {
          // Gọi AI để lấy cả Rubric và Skill Tags
          const aiData = await generateRubric(q.content, q.max_score || 10);
          
          if (aiData) {
            // AI trả về object { rubric: [...], suggested_skill_tags: [...] }
            rubric = aiData.rubric;
            skills = aiData.suggested_skill_tags; 
          }
        }
        else if (q.type === 'mcq') {
          // Trắc nghiệm: Lưu options, đáp án đúng và gọi AI sinh skills
          mcqOptions = q.options; // Mảng string ["A", "B", "C", "D"]
          mcqCorrectIndex = q.correct_index; // Số nguyên (0, 1, 2...)

          // Gọi AI chỉ để lấy skills
          const aiData = await analyzeMCQ(q.content, mcqOptions);
          if (aiData) {
            skills = aiData.suggested_skill_tags;
          }
        }
        else if (q.type === 'code') {
          // --- XỬ LÝ MỚI CHO CODE ---
          codeLang = q.code_lang || 'javascript'; // Mặc định JS nếu ko gửi
          
          // Gọi AI sinh test case tự động
          const aiData = await generateTestCases(q.content);
          if (aiData) {
            codeTestCases = aiData.test_cases;
            skills = aiData.suggested_skill_tags;
          }
        }

        // Tạo câu hỏi trong DB
        await Question.create({
          assignment_id: newAssignment.assignment_id,
          content: q.content,
          question_type: q.type,
          max_score: q.max_score || 10,
          ai_rubric: rubric,  // Lưu Rubric (nếu có)
          skill_tags: skills,  // Lưu Skill Tags (quan trọng cho Analytics)
          mcq_options: mcqOptions,        // Lưu options
          mcq_correct_index: mcqCorrectIndex, // Lưu đáp án đúng
          code_lang: codeLang,
          code_test_cases: codeTestCases
        }, { transaction: t });
      }
    }

    return newAssignment;
  });
};

const getAssignmentDetails = async (id) => {
  return await Assignment.findOne({
    where: { assignment_id: id },
    include: [{ model: Question }]
  });
};

module.exports = { createAssignmentWithQuestions, getAssignmentDetails };