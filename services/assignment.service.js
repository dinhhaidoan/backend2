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
  const { CourseClass, Course } = models;
  return await Assignment.findOne({
    where: { assignment_id: id },
    include: [
      {
        model: Question,
        attributes: [
          'question_id',
          'content',
          'question_type',
          'max_score',
          'mcq_options',
          'mcq_correct_index',
          'code_lang',
          'code_test_cases',
          'ai_rubric',
          'skill_tags'
        ]
      },
      {
        model: CourseClass,
        attributes: ['course_class_id', 'course_class_SKU', 'course_name_vn'],
        include: [{
          model: Course,
          attributes: ['course_id', 'course_name_vn', 'course_name_en', 'course_SKU']
        }]
      }
    ]
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
  const { CourseClass, Course } = models;
  const { Op } = require('sequelize');
  const where = {};
  if (filters.course_class_id) {
    where.course_class_id = filters.course_class_id;
  }
  
  const assignments = await Assignment.findAll({
    where,
    include: [
      { model: Question },
      {
        model: CourseClass,
        attributes: ['course_class_id', 'course_class_SKU', 'course_name_vn'],
        include: [{
          model: Course,
          attributes: ['course_id', 'course_name_vn', 'course_name_en', 'course_SKU']
        }]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Thêm thống kê cho mỗi assignment
  const assignmentsWithStats = await Promise.all(
    assignments.map(async (assignment) => {
      // Lấy tất cả submissions cho assignment này
      const submissions = await Submission.findAll({
        where: { assignment_id: assignment.assignment_id },
        attributes: ['submission_id', 'score', 'submitted_at', 'student_id']
      });

      // Tính toán thống kê
      const totalSubmissions = submissions.length;
      const submittedScores = submissions.filter(s => s.score !== null).map(s => s.score);
      const averageScore = submittedScores.length > 0 
        ? (submittedScores.reduce((a, b) => a + b, 0) / submittedScores.length).toFixed(2)
        : null;
      const highestScore = submittedScores.length > 0 ? Math.max(...submittedScores) : null;
      const lowestScore = submittedScores.length > 0 ? Math.min(...submittedScores) : null;

      // Tính tổng điểm tối đa
      const maxTotalScore = assignment.Questions.reduce((sum, q) => sum + (q.max_score || 0), 0);

      const assignmentData = assignment.toJSON();
      assignmentData.statistics = {
        totalSubmissions,
        submittedCount: submittedScores.length,
        notSubmittedCount: totalSubmissions - submittedScores.length,
        averageScore,
        highestScore,
        lowestScore,
        maxTotalScore
      };

      return assignmentData;
    })
  );

  return assignmentsWithStats;
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
  const { title, description, due_date, status, questions } = data;
  const assignment = await Assignment.findByPk(id);
  
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  // Update basic assignment fields
  await assignment.update({
    title,
    description,
    due_date,
    status
  });

  // Update questions if provided
  if (questions && Array.isArray(questions)) {
    for (const questionData of questions) {
      if (questionData.question_id && questionData.max_score !== undefined) {
        await Question.update(
          { max_score: questionData.max_score },
          { where: { question_id: questionData.question_id, assignment_id: id } }
        );
      }
    }
  }

  return assignment;
};

const getAssignmentSubmissions = async (assignment_id) => {
  const { Student, User } = models;
  
  const assignment = await Assignment.findByPk(assignment_id);
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  const submissions = await Submission.findAll({
    where: { assignment_id },
    include: [
      {
        model: SubmissionDetail,
        include: [{
          model: Question,
          attributes: [
            'question_id',
            'content',
            'question_type',
            'max_score',
            'mcq_options',
            'mcq_correct_index',
            'code_lang',
            'code_test_cases',
            'ai_rubric',
            'skill_tags'
          ]
        }]
      },
      {
        model: Student,
        attributes: ['student_id', 'student_name'],
        include: [{
          model: User,
          attributes: ['user_avatar']
        }]
      }
    ],
    order: [['submitted_at', 'DESC']]
  });

  // Lọc chỉ lấy submission mới nhất của mỗi sinh viên
  const latestSubmissions = {};
  submissions.forEach(sub => {
    const studentId = sub.student_id;
    if (!latestSubmissions[studentId] || 
        new Date(sub.submitted_at) > new Date(latestSubmissions[studentId].submitted_at)) {
      latestSubmissions[studentId] = sub;
    }
  });

  // Transform data to match frontend expectations
  return Object.values(latestSubmissions).map(sub => {
    const details = sub.SubmissionDetails || [];
    
    // Create answers object indexed by question order
    const answers = {};
    details.forEach((detail, idx) => {
      // MCQ: Store selected_option_index
      if (detail.selected_option_index !== null && detail.selected_option_index !== undefined) {
        answers[idx] = detail.selected_option_index;
      } 
      // Essay/Code: Store student_answer text
      else if (detail.student_answer) {
        answers[idx] = detail.student_answer;
      }
    });

    return {
      id: sub.submission_id,
      studentId: sub.student_id,
      studentName: sub.Student?.student_name || 'Unknown',
      avatar: sub.Student?.User?.user_avatar || null,
      score: sub.score,
      submittedAt: sub.submitted_at,
      feedback: sub.feedback,
      answers,
      details: details.map(d => ({
        detailId: d.submission_detail_id,
        questionId: d.question_id,
        answer: d.student_answer,
        selectedIndex: d.selected_option_index,
        aiScore: d.ai_score,
        aiFeedback: d.ai_feedback,
        aiErrorTags: d.ai_error_tags,
        finalScore: d.final_score
      }))
    };
  });
};

module.exports = { createAssignmentWithQuestions, getAssignmentDetails, autoGenerateAssignment, getAllAssignments, deleteAssignment, updateAssignment, getAssignmentSubmissions };