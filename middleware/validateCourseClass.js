// Lightweight validator for CourseClass
const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const createRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.course_id || !isPositiveInt(b.course_id)) {
    errors.push({ field: 'course_id', message: 'course_id is required and must be a positive integer' });
  }
  if (b.course_class_suffix !== undefined && b.course_class_suffix !== null && String(b.course_class_suffix).trim() !== '') {
    if (!isPositiveInt(b.course_class_suffix)) errors.push({ field: 'course_class_suffix', message: 'course_class_suffix must be a positive integer' });
  }
  if (b.teacher_id !== undefined && b.teacher_id !== null && String(b.teacher_id).trim() !== '') {
    if (!isPositiveInt(b.teacher_id)) errors.push({ field: 'teacher_id', message: 'teacher_id must be a positive integer' });
  }
  if (b.room_id !== undefined && b.room_id !== null && String(b.room_id).trim() !== '') {
    if (!isPositiveInt(b.room_id)) errors.push({ field: 'room_id', message: 'room_id must be a positive integer' });
  }
  if (b.capacity !== undefined && b.capacity !== null && String(b.capacity).trim() !== '') {
    if (!isPositiveInt(b.capacity)) errors.push({ field: 'capacity', message: 'capacity must be a positive integer' });
  }
  if (b.status !== undefined && b.status !== null && String(b.status).trim() !== '') {
    const allowed = ['open', 'teaching', 'closed'];
    if (!allowed.includes(String(b.status))) errors.push({ field: 'status', message: `status must be one of ${allowed.join(', ')}` });
  }

  req._courseClassValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (b.course_id !== undefined) {
    if (!isPositiveInt(b.course_id)) errors.push({ field: 'course_id', message: 'course_id must be a positive integer' });
  }
  if (b.course_class_suffix !== undefined) {
    if (b.course_class_suffix === null || String(b.course_class_suffix).trim() === '') {
      // allow clearing
    } else if (!isPositiveInt(b.course_class_suffix)) {
      errors.push({ field: 'course_class_suffix', message: 'course_class_suffix must be a positive integer or null' });
    }
  }
  if (b.teacher_id !== undefined && b.teacher_id !== null && String(b.teacher_id).trim() !== '') {
    if (!isPositiveInt(b.teacher_id)) errors.push({ field: 'teacher_id', message: 'teacher_id must be a positive integer' });
  }
  if (b.room_id !== undefined && b.room_id !== null && String(b.room_id).trim() !== '') {
    if (!isPositiveInt(b.room_id)) errors.push({ field: 'room_id', message: 'room_id must be a positive integer' });
  }
  if (b.capacity !== undefined && b.capacity !== null && String(b.capacity).trim() !== '') {
    if (!isPositiveInt(b.capacity)) errors.push({ field: 'capacity', message: 'capacity must be a positive integer' });
  }
  if (b.status !== undefined) {
    if (b.status === null || String(b.status).trim() === '') {
      // allow clearing? but in our model status is NOT nullable --> reject clearing
      errors.push({ field: 'status', message: 'status cannot be null or empty' });
    } else {
      const allowed = ['open', 'teaching', 'closed'];
      if (!allowed.includes(String(b.status))) errors.push({ field: 'status', message: `status must be one of ${allowed.join(', ')}` });
    }
  }

  req._courseClassValidation = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req._courseClassValidation || [];
  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { createRules, updateRules, validate };
