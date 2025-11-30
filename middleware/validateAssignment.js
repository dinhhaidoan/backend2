// Lightweight validation for Assignment create/update
const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const createRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.assignment_title || String(b.assignment_title).trim() === '') errors.push({ field: 'assignment_title', message: 'assignment_title is required' });
  if (!b.course_class_id || !isPositiveInt(b.course_class_id)) errors.push({ field: 'course_class_id', message: 'course_class_id is required and must be positive integer' });
  if (!b.assignment_type || !['essay','mcq','mixed'].includes(String(b.assignment_type))) errors.push({ field: 'assignment_type', message: 'assignment_type is required and must be essay|mcq|mixed' });
  if (b.assignment_max_score !== undefined && b.assignment_max_score !== null && String(b.assignment_max_score).trim() !== '') {
    const v = Number(b.assignment_max_score);
    if (Number.isNaN(v) || v <= 0) errors.push({ field: 'assignment_max_score', message: 'assignment_max_score must be a positive number' });
  }
  // questions validation - if present
  if (Array.isArray(b.questions)) {
    for (let i=0;i<b.questions.length;i++) {
      const q = b.questions[i] || {};
      if (!q.question_type || !['essay','mcq'].includes(String(q.question_type))) errors.push({ field: `questions[${i}].question_type`, message: 'question_type must be essay|mcq' });
      if (!q.question_content || String(q.question_content).trim() === '') errors.push({ field: `questions[${i}].question_content`, message: 'question_content is required' });
      if (q.question_type === 'mcq') {
        if (!Array.isArray(q.options) || !q.options.length) errors.push({ field: `questions[${i}].options`, message: 'MCQ must have options array' });
        else {
          let hasCorrect = 0;
          for (let j=0;j<q.options.length;j++) { if (q.options[j] && q.options[j].option_is_correct) hasCorrect++; }
          if (hasCorrect !== 1) errors.push({ field: `questions[${i}].options`, message: 'MCQ must have exactly one correct option' });
        }
      }
    }
  }

  req._assignmentValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  // similar to create but fields optional
  const errors = [];
  const b = req.body || {};
  if (b.course_class_id !== undefined && b.course_class_id !== null && String(b.course_class_id).trim() !== '') {
    if (!isPositiveInt(b.course_class_id)) errors.push({ field: 'course_class_id', message: 'course_class_id must be positive integer' });
  }
  if (b.assignment_type !== undefined && b.assignment_type !== null && String(b.assignment_type).trim() !== '') {
    if (!['essay','mcq','mixed'].includes(String(b.assignment_type))) errors.push({ field: 'assignment_type', message: 'assignment_type must be essay|mcq|mixed' });
  }
  if (b.assignment_max_score !== undefined && b.assignment_max_score !== null && String(b.assignment_max_score).trim() !== '') {
    const v = Number(b.assignment_max_score);
    if (Number.isNaN(v) || v <= 0) errors.push({ field: 'assignment_max_score', message: 'assignment_max_score must be a positive number' });
  }
  // questions validation same as create
  if (Array.isArray(b.questions)) {
    for (let i=0;i<b.questions.length;i++) {
      const q = b.questions[i] || {};
      if (!q.question_type || !['essay','mcq'].includes(String(q.question_type))) errors.push({ field: `questions[${i}].question_type`, message: 'question_type must be essay|mcq' });
      if (!q.question_content || String(q.question_content).trim() === '') errors.push({ field: `questions[${i}].question_content`, message: 'question_content is required' });
      if (q.question_type === 'mcq') {
        if (!Array.isArray(q.options) || !q.options.length) errors.push({ field: `questions[${i}].options`, message: 'MCQ must have options array' });
        else {
          let hasCorrect = 0;
          for (let j=0;j<q.options.length;j++) { if (q.options[j] && q.options[j].option_is_correct) hasCorrect++; }
          if (hasCorrect !== 1) errors.push({ field: `questions[${i}].options`, message: 'MCQ must have exactly one correct option' });
        }
      }
    }
  }

  req._assignmentValidation = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req._assignmentValidation || [];
  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { createRules, updateRules, validate };
