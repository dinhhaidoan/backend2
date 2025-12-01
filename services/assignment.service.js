const { sequelize, models } = require('../models/index.model');
const { Assignment, Question } = models;
const { generateRubric, analyzeMCQ, generateTestCases,generateQuestionsByTopic } = require('./ai.service');

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

const autoGenerateAssignment = async ({ course_class_id, topic, difficulty, quantity, type, title }) => {
  return await sequelize.transaction(async (t) => {
    // 1. Gọi AI sinh câu hỏi
    const questionsData = await generateQuestionsByTopic(topic, difficulty, quantity, type);

    if (!questionsData || questionsData.length === 0) {
      throw new Error("AI không thể tạo câu hỏi lúc này. Vui lòng thử lại.");
    }

    // 2. Tạo Assignment (Draft)
    const newAssignment = await Assignment.create({
      course_class_id,
      title: title || `Bài tập tự động: ${topic}`,
      description: `Được tạo tự động bởi AI. Chủ đề: ${topic}, Độ khó: ${difficulty}`,
      status: 'draft', // Quan trọng: Để draft cho GV sửa trước khi published
      type: 'mixed' // Hoặc theo type truyền vào
    }, { transaction: t });

    // 3. Chuẩn bị dữ liệu Questions để Bulk Create
    const questionsPayload = questionsData.map(q => ({
      assignment_id: newAssignment.assignment_id,
      content: q.content,
      question_type: type === 'essay' ? 'essay' : 'mcq', // Map đúng enum
      max_score: q.max_score || 10,
      skill_tags: q.suggested_skill_tags,
      mcq_options: q.options || null,
      mcq_correct_index: q.correct_index,
      // Nếu là essay, có thể gọi thêm hàm generateRubric ở đây nếu muốn hệ thống hoàn hảo
    }));

    // 4. Lưu câu hỏi vào DB
    await Question.bulkCreate(questionsPayload, { transaction: t });

    return newAssignment; // Trả về assignment để FE redirect tới trang Edit
  });
};

module.exports = { createAssignmentWithQuestions, getAssignmentDetails, autoGenerateAssignment };