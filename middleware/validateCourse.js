const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const createRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.course_SKU || typeof b.course_SKU !== 'string' || !b.course_SKU.trim()) errors.push({ field: 'course_SKU', message: 'course_SKU is required' });
  if (!b.course_name_vn || typeof b.course_name_vn !== 'string' || !b.course_name_vn.trim()) errors.push({ field: 'course_name_vn', message: 'course_name_vn is required' });
  if (b.credits !== undefined && !isPositiveInt(b.credits)) errors.push({ field: 'credits', message: 'credits must be a positive integer' });
  if (b.course_type !== undefined && !['required','elective'].includes(b.course_type)) errors.push({ field: 'course_type', message: 'course_type must be required or elective' });
  if (b.semester_id !== undefined && b.semester_id !== null && String(b.semester_id).trim() !== '' && !isPositiveInt(b.semester_id)) errors.push({ field: 'semester_id', message: 'semester_id must be a positive integer' });

  if (b.major_ids !== undefined) {
    if (!Array.isArray(b.major_ids)) errors.push({ field: 'major_ids', message: 'major_ids must be array' });
    else {
      for (const v of b.major_ids) if (!isPositiveInt(v)) errors.push({ field: 'major_ids', message: 'each major_id must be a positive integer' });
    }
  }
  if (b.prerequisite_ids !== undefined) {
    if (!Array.isArray(b.prerequisite_ids)) errors.push({ field: 'prerequisite_ids', message: 'prerequisite_ids must be array' });
    else {
      for (const v of b.prerequisite_ids) if (!isPositiveInt(v)) errors.push({ field: 'prerequisite_ids', message: 'each prerequisite_id must be a positive integer' });
    }
  }

  req._courseValidation = errors; next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (b.course_SKU !== undefined) { if (!b.course_SKU || typeof b.course_SKU !== 'string' || !b.course_SKU.trim()) errors.push({ field: 'course_SKU', message: 'course_SKU must be a non-empty string' }); }
  if (b.course_name_vn !== undefined) { if (!b.course_name_vn || typeof b.course_name_vn !== 'string' || !b.course_name_vn.trim()) errors.push({ field: 'course_name_vn', message: 'course_name_vn must be a non-empty string' }); }
  if (b.credits !== undefined && !isPositiveInt(b.credits)) errors.push({ field: 'credits', message: 'credits must be a positive integer' });
  if (b.course_type !== undefined && !['required','elective'].includes(b.course_type)) errors.push({ field: 'course_type', message: 'course_type must be required or elective' });
  if (b.semester_id !== undefined && b.semester_id !== null && String(b.semester_id).trim() !== '' && !isPositiveInt(b.semester_id)) errors.push({ field: 'semester_id', message: 'semester_id must be a positive integer' });

  if (b.major_ids !== undefined) {
    if (!Array.isArray(b.major_ids)) errors.push({ field: 'major_ids', message: 'major_ids must be array' });
    else for (const v of b.major_ids) if (!isPositiveInt(v)) errors.push({ field: 'major_ids', message: 'each major_id must be a positive integer' });
  }
  if (b.prerequisite_ids !== undefined) {
    if (!Array.isArray(b.prerequisite_ids)) errors.push({ field: 'prerequisite_ids', message: 'prerequisite_ids must be array' });
    else for (const v of b.prerequisite_ids) if (!isPositiveInt(v)) errors.push({ field: 'prerequisite_ids', message: 'each prerequisite_id must be a positive integer' });
  }

  req._courseValidation = errors; next();
};

const validate = (req, res, next) => {
  const errors = req._courseValidation || [];
  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { createRules, updateRules, validate };
