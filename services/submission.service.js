// services/submission.service.js
const { sequelize, models } = require('../models/index.model');
const { Submission, SubmissionDetail, Assignment, Question } = models;
const { gradeSubmission, gradeCode } = require('./ai.service');

const submitAndGrade = async (payload) => {
  const { assignment_id, student_id, answers } = payload; 
  // answers: [{ question_id: 1, text: "...", selected_index: 1 }] <--- Thêm selected_index cho MCQ

  return await sequelize.transaction(async (t) => {
    // 1. Tạo Submission
    const submission = await Submission.create({
      assignment_id,
      student_id,
      score: 0,
      feedback: "Đang chấm...",
      submitted_at: new Date()
    }, { transaction: t });

    const assignment = await Assignment.findOne({
      where: { assignment_id },
      include: [{ model: Question }],
      transaction: t
    });

    if (!assignment) throw new Error('Bài tập không tồn tại');

    let totalScore = 0;
    let detailRecords = [];

    // 2. Chấm từng câu
    for (const ans of answers) {
      const question = assignment.Questions.find(q => q.question_id === ans.question_id);
      
      if (question) {
        let earnedScore = 0;
        let feedback = "";
        let errorTags = [];

        // --- LOGIC CHẤM TỰ LUẬN (ESSAY) ---
        if (question.question_type === 'essay') {
          console.log(`🤖 AI đang chấm tự luận câu ${question.question_id}...`);
          const aiResult = await gradeSubmission(question.content, question.ai_rubric, ans.text, question.max_score);
          earnedScore = aiResult.score;
          feedback = aiResult.feedback;
          errorTags = aiResult.error_tags;
        } 
        // --- LOGIC CHẤM TRẮC NGHIỆM (MCQ) ---
        else if (question.question_type === 'mcq') {
          console.log(`✅ Hệ thống đang chấm trắc nghiệm câu ${question.question_id}...`);
          // So sánh index sinh viên chọn với đáp án đúng trong DB
          const isCorrect = (ans.selected_index === question.mcq_correct_index);
          
          if (isCorrect) {
            earnedScore = question.max_score;
            feedback = "Chính xác!";
          } else {
            earnedScore = 0;
            feedback = "Sai rồi.";
            errorTags = ["Sai đáp án trắc nghiệm"]; // Tag lỗi để Analytics đếm
          }
        }
        else if (question.question_type === 'code') {
          console.log(`💻 AI đang chấm code câu ${question.question_id}...`);
          
          const aiResult = await gradeCode(
            question.content,
            question.code_test_cases, // Lấy test cases từ DB
            ans.text,                 // Code sinh viên nộp
            question.code_lang,
            question.max_score
          );

          earnedScore = aiResult.score;
          feedback = aiResult.feedback;
          errorTags = aiResult.error_tags;
        }

        totalScore += earnedScore;

        detailRecords.push({
          submission_id: submission.submission_id,
          question_id: question.question_id,
          student_answer: ans.text, // Có thể để null nếu là mcq
          selected_option_index: ans.selected_index, // Lưu index chọn (cho MCQ)
          ai_score: earnedScore,
          ai_feedback: feedback,
          ai_error_tags: errorTags,
          final_score: earnedScore
        });
      }
    }

    // 3. Lưu chi tiết
    if (detailRecords.length > 0) {
      await SubmissionDetail.bulkCreate(detailRecords, { transaction: t });
    }

    // 4. Update tổng điểm
    await submission.update({ 
      score: totalScore,
      feedback: "Hoàn thành chấm bài." 
    }, { transaction: t });

    return await Submission.findOne({
      where: { submission_id: submission.submission_id },
      include: [{ model: SubmissionDetail }],
      transaction: t
    });
  });
};

module.exports = { submitAndGrade };