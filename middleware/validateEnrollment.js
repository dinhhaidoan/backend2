// Lightweight validator for Enrollment
const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const enrollRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.student_id || !isPositiveInt(b.student_id)) {
    errors.push({ field: 'student_id', message: 'student_id is required and must be a positive integer' });
  }
  if (!b.course_class_id || !isPositiveInt(b.course_class_id)) {
    errors.push({ field: 'course_class_id', message: 'course_class_id is required and must be a positive integer' });
  }
  if (b.group_id !== undefined && b.group_id !== null && String(b.group_id).trim() !== '') {
    if (!isPositiveInt(b.group_id)) errors.push({ field: 'group_id', message: 'group_id must be a positive integer' });
  }

  req._enrollmentValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (b.group_id !== undefined && b.group_id !== null && String(b.group_id).trim() !== '') {
    if (!isPositiveInt(b.group_id)) errors.push({ field: 'group_id', message: 'group_id must be a positive integer' });
  }
  if (b.status !== undefined && b.status !== null && String(b.status).trim() !== '') {
    const allowed = ['enrolled', 'dropped'];
    if (!allowed.includes(String(b.status))) errors.push({ field: 'status', message: `status must be one of ${allowed.join(', ')}` });
  }

  req._enrollmentValidation = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req._enrollmentValidation || [];
  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { enrollRules, updateRules, validate };