// Lightweight validator for OfficeClass
const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const createRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.office_class_SKU || typeof b.office_class_SKU !== 'string' || !b.office_class_SKU.trim()) {
    errors.push({ field: 'office_class_SKU', message: 'office_class_SKU is required' });
  }
  if (!b.office_class_name || typeof b.office_class_name !== 'string' || !b.office_class_name.trim()) {
    errors.push({ field: 'office_class_name', message: 'office_class_name is required' });
  }
  if (!isPositiveInt(b.teacher_id)) {
    errors.push({ field: 'teacher_id', message: 'teacher_id is required and must be a positive integer' });
  }
  if (!isPositiveInt(b.academic_year_id)) {
    errors.push({ field: 'academic_year_id', message: 'academic_year_id is required and must be a positive integer' });
  }
  // major_id is optional, but if provided must be a positive integer
  if (b.major_id !== undefined && b.major_id !== null && String(b.major_id).trim() !== '') {
    if (!isPositiveInt(b.major_id)) errors.push({ field: 'major_id', message: 'major_id must be a positive integer' });
  }

  req._officeClassValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (b.office_class_SKU !== undefined) {
    if (!b.office_class_SKU || typeof b.office_class_SKU !== 'string' || !b.office_class_SKU.trim()) errors.push({ field: 'office_class_SKU', message: 'office_class_SKU must be a non-empty string' });
  }
  if (b.office_class_name !== undefined) {
    if (!b.office_class_name || typeof b.office_class_name !== 'string' || !b.office_class_name.trim()) errors.push({ field: 'office_class_name', message: 'office_class_name must be a non-empty string' });
  }
  if (b.teacher_id !== undefined) {
    if (!isPositiveInt(b.teacher_id)) errors.push({ field: 'teacher_id', message: 'teacher_id must be a positive integer' });
  }
  if (b.academic_year_id !== undefined) {
    if (!isPositiveInt(b.academic_year_id)) errors.push({ field: 'academic_year_id', message: 'academic_year_id must be a positive integer' });
  }
  if (b.major_id !== undefined) {
    // allow null/empty to clear, otherwise must be positive int
    if (b.major_id === null || String(b.major_id).trim() === '') {
      // ok: clearing
    } else if (!isPositiveInt(b.major_id)) {
      errors.push({ field: 'major_id', message: 'major_id must be a positive integer or null to clear' });
    }
  }

  req._officeClassValidation = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req._officeClassValidation || [];
  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { createRules, updateRules, validate };
