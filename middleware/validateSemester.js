// Lightweight validator for Semester requests (no external deps)
const isValidDate = (v) => {
  if (!v) return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
};

const createRules = (req, res, next) => {
  const errors = [];
  const body = req.body || {};
  if (!body.semester_name || typeof body.semester_name !== 'string' || !body.semester_name.trim()) {
    errors.push({ field: 'semester_name', message: 'semester_name is required' });
  }
  if (!body.semester_start || !isValidDate(body.semester_start)) {
    errors.push({ field: 'semester_start', message: 'semester_start is required and must be a valid date' });
  }
  if (!body.semester_end || !isValidDate(body.semester_end)) {
    errors.push({ field: 'semester_end', message: 'semester_end is required and must be a valid date' });
  }
  if (body.max_credits !== undefined && (isNaN(Number(body.max_credits)) || Number(body.max_credits) < 0)) {
    errors.push({ field: 'max_credits', message: 'max_credits must be a non-negative integer' });
  }
  // semesters are standalone; no academic_year_id validation

  req._semesterValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const body = req.body || {};
  if (body.semester_name !== undefined) {
    if (!body.semester_name || typeof body.semester_name !== 'string' || !body.semester_name.trim()) {
      errors.push({ field: 'semester_name', message: 'semester_name must be a non-empty string' });
    }
  }
  if (body.semester_start !== undefined) {
    if (!isValidDate(body.semester_start)) errors.push({ field: 'semester_start', message: 'semester_start must be a valid date' });
  }
  if (body.semester_end !== undefined) {
    if (!isValidDate(body.semester_end)) errors.push({ field: 'semester_end', message: 'semester_end must be a valid date' });
  }
  if (body.max_credits !== undefined) {
    if (isNaN(Number(body.max_credits)) || Number(body.max_credits) < 0) errors.push({ field: 'max_credits', message: 'max_credits must be a non-negative integer' });
  }
  // semesters are standalone; no academic_year_id validation

  req._semesterValidation = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req._semesterValidation || [];
  const { semester_start, semester_end } = req.body || {};
  if (semester_start !== undefined && semester_end !== undefined) {
    if (isValidDate(semester_start) && isValidDate(semester_end)) {
      if (new Date(semester_end) < new Date(semester_start)) {
        errors.push({ field: 'semester_end', message: 'semester_end must be greater or equal to semester_start' });
      }
    }
  }

  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { createRules, updateRules, validate };
