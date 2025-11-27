// Lightweight validator for AcademicYear requests (no external deps)
const createRules = (req, res, next) => {
  const errors = [];
  const body = req.body || {};
  if (!body.academic_year_name || typeof body.academic_year_name !== 'string' || !body.academic_year_name.trim()) {
    errors.push({ field: 'academic_year_name', message: 'academic_year_name is required' });
  }
  if (body.academic_year_start === undefined || body.academic_year_start === null || body.academic_year_start === '') {
    errors.push({ field: 'academic_year_start', message: 'academic_year_start is required' });
  } else if (!Number.isInteger(Number(body.academic_year_start)) || Number(body.academic_year_start) < 1900 || Number(body.academic_year_start) > 3000) {
    errors.push({ field: 'academic_year_start', message: 'academic_year_start must be a valid year' });
  }
  if (body.academic_year_end === undefined || body.academic_year_end === null || body.academic_year_end === '') {
    errors.push({ field: 'academic_year_end', message: 'academic_year_end is required' });
  } else if (!Number.isInteger(Number(body.academic_year_end)) || Number(body.academic_year_end) < 1900 || Number(body.academic_year_end) > 3000) {
    errors.push({ field: 'academic_year_end', message: 'academic_year_end must be a valid year' });
  }

  req._academicYearValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const body = req.body || {};
  if (body.academic_year_name !== undefined) {
    if (!body.academic_year_name || typeof body.academic_year_name !== 'string' || !body.academic_year_name.trim()) {
      errors.push({ field: 'academic_year_name', message: 'academic_year_name must be a non-empty string' });
    }
  }
  if (body.academic_year_start !== undefined) {
    if (!Number.isInteger(Number(body.academic_year_start)) || Number(body.academic_year_start) < 1900 || Number(body.academic_year_start) > 3000) {
      errors.push({ field: 'academic_year_start', message: 'academic_year_start must be a valid year' });
    }
  }
  if (body.academic_year_end !== undefined) {
    if (!Number.isInteger(Number(body.academic_year_end)) || Number(body.academic_year_end) < 1900 || Number(body.academic_year_end) > 3000) {
      errors.push({ field: 'academic_year_end', message: 'academic_year_end must be a valid year' });
    }
  }

  req._academicYearValidation = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req._academicYearValidation || [];
  const { academic_year_start, academic_year_end } = req.body || {};
  if (academic_year_start !== undefined && academic_year_end !== undefined) {
    if (Number(academic_year_end) < Number(academic_year_start)) {
      errors.push({ field: 'academic_year_end', message: 'academic_year_end must be greater or equal to academic_year_start' });
    }
  }

  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { createRules, updateRules, validate };
