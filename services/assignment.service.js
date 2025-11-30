const { sequelize, models } = require('../models/index.model');
const { Assignment, AssignmentQuestion, AssignmentQuestionOption, CourseClass, Teacher, User } = models;

const pick = (obj = {}, keys = []) => {
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
};

const validateMCQOptions = (options = []) => {
  const optionCount = Array.isArray(options) ? options.length : 0;
  if (optionCount === 0) throw new Error('MCQ question must have options');
  const correctCount = options.filter(o => o.option_is_correct === true).length;
  if (correctCount !== 1) throw new Error('MCQ question must have exactly one correct option');
};

const distributePoints = (assignmentMaxScore, questions) => {
  // If assignmentMaxScore provided and all question_points are null/undefined, divide equally
  const count = (questions || []).length;
  if (!assignmentMaxScore || !count) return questions;
  let totalSpecified = 0;
  let unspecifiedCount = 0;
  for (const q of questions) {
    if (q.question_points !== undefined && q.question_points !== null) totalSpecified += Number(q.question_points);
    else unspecifiedCount += 1;
  }
  // If there are unspecified and totalSpecified < maxScore, distribute remaining evenly
  const remaining = Number(assignmentMaxScore) - Number(totalSpecified || 0);
  if (remaining < 0) {
    // Do not automatically reduce specified points; throw to alert user
    throw new Error('Sum of question points exceeds assignment max score');
  }
  if (unspecifiedCount === 0) return questions; // nothing to distribute
  const each = Number((remaining / unspecifiedCount).toFixed(2));
  // assign evenly; last gets adjustment to match exactly
  let assigned = 0;
  return questions.map((q, i) => {
    if (q.question_points !== undefined && q.question_points !== null) return q;
    assigned += each;
    const isLast = i === questions.length - 1;
    if (isLast) {
      q.question_points = Number((assignmentMaxScore - (assigned - each)).toFixed(2));
    } else {
      q.question_points = each;
    }
    return q;
  });
};

const createAssignment = async ({ assignment: assignmentData = {}, user_code } = {}) => {
  if (!assignmentData) throw new Error('Missing assignment payload');
  if (!assignmentData.assignment_title) throw new Error('assignment_title is required');
  if (!assignmentData.course_class_id) throw new Error('course_class_id is required');
  if (!assignmentData.assignment_type) throw new Error('assignment_type is required');

  return await sequelize.transaction(async (t) => {
    let created_by = assignmentData.created_by_user_id;
    if (!created_by) {
      if (!user_code) throw new Error('Missing user_code for created_by');
      const user = await User.findOne({ where: { user_code }, transaction: t });
      if (!user) throw new Error('User not found');
      created_by = user.user_id;
    }

    const cc = await CourseClass.findOne({ where: { course_class_id: assignmentData.course_class_id }, transaction: t });
    if (!cc) throw new Error('CourseClass not found');

    const allowed = ['assignment_title', 'course_class_id', 'assignment_type', 'assignment_due_date', 'assignment_max_score', 'assignment_description', 'created_by_user_id', 'created_at', 'updated_at'];
    const payload = pick(assignmentData, allowed);
    payload.created_by_user_id = created_by;

    const questions = Array.isArray(assignmentData.questions) ? assignmentData.questions : [];
    // validate MCQ questions have options and exactly 1 correct option
    for (const q of questions) {
      if (!q.question_type) throw new Error('Each question must have question_type');
      if (!q.question_content) throw new Error('Each question must have question_content');
      if (q.question_type === 'mcq') {
        if (!Array.isArray(q.options) || !q.options.length) throw new Error('MCQ questions must include options');
        validateMCQOptions(q.options);
      }
    }

    // distribute points if needed
    let preparedQuestions = distributePoints(payload.assignment_max_score, questions);

    const newAssignment = await Assignment.create(payload, { transaction: t });

    // insert questions and options
    for (const q of preparedQuestions) {
      const qPayload = { assignment_id: newAssignment.assignment_id, question_type: q.question_type, question_content: q.question_content, question_points: q.question_points };
      const savedQ = await AssignmentQuestion.create(qPayload, { transaction: t });
      if (q.question_type === 'mcq') {
        for (const opt of q.options) {
          const optPayload = { assignment_question_id: savedQ.assignment_question_id, option_text: opt.option_text, option_is_correct: !!opt.option_is_correct };
          await AssignmentQuestionOption.create(optPayload, { transaction: t });
        }
      }
    }

    const assignment = await Assignment.findOne({ where: { assignment_id: newAssignment.assignment_id }, include: [ { model: AssignmentQuestion, include: [ AssignmentQuestionOption ] } ], transaction: t });
    return assignment;
  });
};

const getAssignments = async ({ course_class_id, teacher_code, page = 1, limit = 20 } = {}) => {
  const where = {};
  page = Number.parseInt(page, 10) || 1;
  limit = Number.parseInt(limit, 10) || 20;
  if (limit <= 0) limit = 20;
  const offset = Math.max(0, (page - 1) * limit);
  if (course_class_id) where.course_class_id = course_class_id;

  const courseClassInclude = { model: CourseClass };
  if (teacher_code) {
    courseClassInclude.required = true;
    courseClassInclude.include = [ { model: Teacher, where: { teacher_code }, required: true } ];
  }

  const include = [ courseClassInclude, { model: AssignmentQuestion, include: [ AssignmentQuestionOption ] } ];
  const query = { where, include, offset, limit, order: [['assignment_due_date','ASC']], distinct: true, subQuery: false, includeIgnoreAttributes: false };
  const result = await Assignment.findAndCountAll(query);
  return result;
};

const getAssignmentById = async (id) => {
  if (!id) throw new Error('Missing assignment_id');
  const a = await Assignment.findOne({ where: { assignment_id: id }, include: [ { model: AssignmentQuestion, include: [ AssignmentQuestionOption ] } ] });
  if (!a) throw new Error('Assignment not found');
  return a;
};

const updateAssignment = async (id, { assignment: assignmentData = {} } = {}) => {
  if (!id) throw new Error('Missing assignment_id');
  if (!assignmentData || Object.keys(assignmentData).length === 0) throw new Error('Empty payload');

  return await sequelize.transaction(async (t) => {
    const existing = await Assignment.findOne({ where: { assignment_id: id }, transaction: t });
    if (!existing) throw new Error('Assignment not found');

    const allowed = ['assignment_title', 'assignment_due_date', 'assignment_max_score', 'assignment_description', 'assignment_type', 'updated_at', 'course_class_id'];
    const payload = pick(assignmentData, allowed);
    if (Object.keys(payload).length) await Assignment.update(payload, { where: { assignment_id: id }, transaction: t });

    // handle questions: if provided, replace all existing questions (simple implementation)
    if (Array.isArray(assignmentData.questions)) {
      // validate questions same as create
      for (const q of assignmentData.questions) {
        if (!q.question_type) throw new Error('Each question must have question_type');
        if (!q.question_content) throw new Error('Each question must have question_content');
        if (q.question_type === 'mcq') {
          if (!Array.isArray(q.options) || !q.options.length) throw new Error('MCQ questions must include options');
          validateMCQOptions(q.options);
        }
      }

      // Optional: distribute points if assignment_max_score provided and questions have unspecified points
      const assignmentObj = await Assignment.findOne({ where: { assignment_id: id }, transaction: t });
      let prepared = distributePoints(assignmentObj.assignment_max_score, assignmentData.questions);

      // delete existing question options / questions
      const existingQuestions = await AssignmentQuestion.findAll({ where: { assignment_id: id }, transaction: t });
      const existingQuestionIds = existingQuestions.map(q => q.assignment_question_id);
      if (existingQuestionIds.length) {
        await AssignmentQuestionOption.destroy({ where: { assignment_question_id: existingQuestionIds }, transaction: t });
        await AssignmentQuestion.destroy({ where: { assignment_question_id: existingQuestionIds }, transaction: t });
      }

      // create new ones
      for (const q of prepared) {
        const savedQ = await AssignmentQuestion.create({ assignment_id: id, question_type: q.question_type, question_content: q.question_content, question_points: q.question_points }, { transaction: t });
        if (q.question_type === 'mcq') {
          for (const opt of q.options) {
            await AssignmentQuestionOption.create({ assignment_question_id: savedQ.assignment_question_id, option_text: opt.option_text, option_is_correct: !!opt.option_is_correct }, { transaction: t });
          }
        }
      }
    }

    const updated = await Assignment.findOne({ where: { assignment_id: id }, include: [ { model: AssignmentQuestion, include: [ AssignmentQuestionOption ] } ], transaction: t });
    return updated;
  });
};

const deleteAssignment = async (id) => {
  if (!id) throw new Error('Missing assignment_id');
  return await sequelize.transaction(async (t) => {
    const qList = await AssignmentQuestion.findAll({ where: { assignment_id: id }, transaction: t });
    const qIds = qList.map(q => q.assignment_question_id);
    if (qIds.length) await AssignmentQuestionOption.destroy({ where: { assignment_question_id: qIds }, transaction: t });
    await AssignmentQuestion.destroy({ where: { assignment_id: id }, transaction: t });
    await Assignment.destroy({ where: { assignment_id: id }, transaction: t });
    return { message: 'Deleted', assignment_id: id };
  });
};

module.exports = { createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment };
