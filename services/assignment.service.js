const { sequelize, models } = require('../models/index.model');
const { Assignment, Question, Submission, SubmissionDetail } = models;
const { generateRubric, analyzeMCQ, generateTestCases,generateQuestionsByTopic } = require('./ai.service');

const createAssignmentWithQuestions = async (data) => {
  const { course_class_id, title, description, due_date, questions } = data;

  return await sequelize.transaction(async (t) => {
    // 1. Tạo Assignment
    const newAssignment = await Assignment.create({
      course_class_id,
      title,
      description,
      due_date,
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

const autoGenerateAssignment = async ({ course_class_id, topic, difficulty, quantity, type, title, mix_options, due_date }) => {
  return await sequelize.transaction(async (t) => {
    // 1. Gọi AI sinh câu hỏi (truyền 'mixed' nếu muốn hỗn hợp)
    const questionsData = await generateQuestionsByTopic(topic, difficulty, quantity, type, mix_options);

    if (!questionsData || questionsData.length === 0) {
      throw new Error("AI không thể tạo câu hỏi lúc này. Vui lòng thử lại.");
    }

    // 2. Tạo Assignment
    const newAssignment = await Assignment.create({
      course_class_id,
      title: title || `Bài tập: ${topic}`,
      description: `Tự động tạo bởi AI (${type}). Chủ đề: ${topic}, Độ khó: ${difficulty}`,
      due_date,
      status: 'draft',
      type: type // Lưu loại assignment là mixed, code, hay mcq
    }, { transaction: t });

    // 3. Chuẩn bị dữ liệu (Mapping thông minh)
    const questionsPayload = questionsData.map(q => {
      // Xác định các trường tùy theo loại câu hỏi mà AI trả về
      const isMCQ = q.question_type === 'mcq';
      const isCode = q.question_type === 'code';
      const isEssay = q.question_type === 'essay';

      return {
        assignment_id: newAssignment.assignment_id,
        content: q.content,
        question_type: q.question_type, // Lấy đúng type AI trả về
        max_score: q.max_score || 10,
        skill_tags: q.suggested_skill_tags,
        
        // Lưu Rubric nếu là Essay
        ai_rubric: isEssay ? q.ai_rubric : null,

        // Chỉ lưu nếu là MCQ
        mcq_options: isMCQ ? q.options : null,
        mcq_correct_index: isMCQ ? q.correct_index : null,

        // Chỉ lưu nếu là Code
        code_lang: isCode ? (q.code_lang || 'javascript') : null,
        code_test_cases: isCode ? q.code_test_cases : null
      };
    });

    // 4. Lưu vào DB
    await Question.bulkCreate(questionsPayload, { transaction: t });

    return newAssignment;
  });
};

const getAllAssignments = async (filters) => {
  const where = {};
  if (filters.course_class_id) {
    where.course_class_id = filters.course_class_id;
  }
  return await Assignment.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });
};

const deleteAssignment = async (id) => {
  const assignment = await Assignment.findByPk(id);
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  await sequelize.transaction(async (t) => {
    // 1. Tìm các submission liên quan
    const submissions = await Submission.findAll({
      where: { assignment_id: id },
      attributes: ['submission_id'],
      transaction: t
    });
    const submissionIds = submissions.map(s => s.submission_id);

    // 2. Xóa SubmissionDetail và Submission nếu có
    if (submissionIds.length > 0) {
      await SubmissionDetail.destroy({
        where: { submission_id: submissionIds },
        transaction: t
      });
      await Submission.destroy({
        where: { assignment_id: id },
        transaction: t
      });
    }

    // 3. Xóa Assignment (Question sẽ được xóa theo cascade nếu có cấu hình)
    await assignment.destroy({ transaction: t });
  });

  return { message: 'Assignment deleted successfully' };
};

const updateAssignment = async (id, data) => {
  const { title, description, due_date, status } = data;
  const assignment = await Assignment.findByPk(id);
  
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  await assignment.update({
    title,
    description,
    due_date,
    status
  });

  return assignment;
};

module.exports = { createAssignmentWithQuestions, getAssignmentDetails, autoGenerateAssignment, getAllAssignments, deleteAssignment, updateAssignment };