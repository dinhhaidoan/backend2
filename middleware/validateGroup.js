// Lightweight validator for Group
const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const createRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.course_class_id || !isPositiveInt(b.course_class_id)) {
    errors.push({ field: 'course_class_id', message: 'course_class_id is required and must be a positive integer' });
  }
  if (!b.group_name || typeof b.group_name !== 'string' || !b.group_name.trim()) {
    errors.push({ field: 'group_name', message: 'group_name is required' });
  }
  if (b.capacity !== undefined && b.capacity !== null && String(b.capacity).trim() !== '') {
    if (!isPositiveInt(b.capacity)) errors.push({ field: 'capacity', message: 'capacity must be a positive integer' });
  }

  req._groupValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (b.group_name !== undefined) {
    if (!b.group_name || typeof b.group_name !== 'string' || !b.group_name.trim()) errors.push({ field: 'group_name', message: 'group_name must be a non-empty string' });
  }
  if (b.capacity !== undefined && b.capacity !== null && String(b.capacity).trim() !== '') {
    if (!isPositiveInt(b.capacity)) errors.push({ field: 'capacity', message: 'capacity must be a positive integer' });
  }

  req._groupValidation = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req._groupValidation || [];
  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { createRules, updateRules, validate };