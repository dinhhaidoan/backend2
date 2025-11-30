const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const allowedScheduleTypes = ['study', 'exam'];
const allowedRepeatTypes = ['none', 'weekly', 'custom_weeks'];

const validateDayShape = (d) => {
  if (!d || typeof d !== 'object') return false;
  const { weekday_id, slots } = d;
  if (!isPositiveInt(weekday_id) || weekday_id < 1 || weekday_id > 7) return false;
  if (!Array.isArray(slots)) return false;
  for (const s of slots) {
    if (!isPositiveInt(s) || s < 1 || s > 13) return false;
  }
  return true;
};

const createRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.course_class_id || !isPositiveInt(b.course_class_id)) errors.push({ field: 'course_class_id', message: 'course_class_id is required and must be a positive integer' });
  if (b.schedule_type !== undefined) {
    if (!allowedScheduleTypes.includes(b.schedule_type)) errors.push({ field: 'schedule_type', message: 'schedule_type must be study or exam' });
  }
  if (b.start_date !== undefined && b.start_date !== null && (typeof b.start_date !== 'string' || b.start_date.trim() === '')) errors.push({ field: 'start_date', message: 'start_date is required and must be a date string (YYYY-MM-DD)' });
  if (b.end_date !== undefined && b.end_date !== null && (typeof b.end_date !== 'string' || b.end_date.trim() === '')) errors.push({ field: 'end_date', message: 'end_date must be a date string (YYYY-MM-DD)' });
  if (b.start_date && b.end_date) {
    const sd = new Date(b.start_date);
    const ed = new Date(b.end_date);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) errors.push({ field: 'dates', message: 'start_date or end_date invalid' });
    else if (sd > ed) errors.push({ field: 'dates', message: 'start_date must be before or equal to end_date' });
  }

  if (b.repeat_type !== undefined) {
    if (!allowedRepeatTypes.includes(b.repeat_type)) errors.push({ field: 'repeat_type', message: `repeat_type must be one of ${allowedRepeatTypes.join(', ')}` });
    if (b.repeat_type === 'custom_weeks' && (!b.repeat_weeks || !isPositiveInt(b.repeat_weeks))) errors.push({ field: 'repeat_weeks', message: 'repeat_weeks must be a positive integer when repeat_type is custom_weeks' });
  }

  // days array
  if (!b.days || !Array.isArray(b.days) || b.days.length === 0) {
    errors.push({ field: 'days', message: 'At least one day is required (weekday + slots)' });
  } else {
    for (const [i, d] of b.days.entries()) {
      if (!validateDayShape(d)) errors.push({ field: `days[${i}]`, message: 'Invalid day shape (weekday_id 1..7, slots array of 1..13)' });
      else {
        // ensure no duplicate slots in that day
        const seen = new Set();
        for (const s of d.slots) {
          if (seen.has(Number(s))) errors.push({ field: `days[${i}]`, message: 'Duplicate slot numbers are not allowed in a day' });
          seen.add(Number(s));
        }
      }
    }
    // ensure no duplicate weekdays among days
    const weekdaySeen = new Set();
    for (const d of b.days) {
      if (!d || !d.weekday_id) continue;
      const w = Number(d.weekday_id);
      if (weekdaySeen.has(w)) errors.push({ field: 'days', message: 'Duplicate weekday entries are not allowed' });
      weekdaySeen.add(w);
    }
  }

  req._courseScheduleValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (b.course_class_id !== undefined && b.course_class_id !== null && !isPositiveInt(b.course_class_id)) errors.push({ field: 'course_class_id', message: 'course_class_id must be a positive integer' });
  if (b.schedule_type !== undefined && !allowedScheduleTypes.includes(b.schedule_type)) errors.push({ field: 'schedule_type', message: 'schedule_type must be study or exam' });
  if (b.repeat_type !== undefined && !allowedRepeatTypes.includes(b.repeat_type)) errors.push({ field: 'repeat_type', message: `repeat_type must be one of ${allowedRepeatTypes.join(', ')}` });
  if (b.repeat_type === 'custom_weeks' && (b.repeat_weeks === undefined || !isPositiveInt(b.repeat_weeks))) errors.push({ field: 'repeat_weeks', message: 'repeat_weeks must be a positive integer when repeat_type is custom_weeks' });

  if (b.days !== undefined) {
    if (!Array.isArray(b.days)) errors.push({ field: 'days', message: 'days must be an array' });
    else {
      for (const [i, d] of b.days.entries()) {
        if (!validateDayShape(d)) errors.push({ field: `days[${i}]`, message: 'Invalid day shape (weekday_id 1..7, slots array of 1..13)' });
      }
    }
  }

  req._courseScheduleValidation = errors;
  next();
};

const autoCreateRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.course_class_id || !isPositiveInt(b.course_class_id)) errors.push({ field: 'course_class_id', message: 'course_class_id is required and must be a positive integer' });
  if (!b.weeks || !isPositiveInt(b.weeks) || Number(b.weeks) < 1) errors.push({ field: 'weeks', message: 'weeks is required and must be a positive integer >=1' });
  if (b.credits !== undefined && (!isPositiveInt(b.credits) || Number(b.credits) <= 0)) errors.push({ field: 'credits', message: 'credits must be a positive integer' });
  if (b.periods_per_credit !== undefined && (!isPositiveInt(b.periods_per_credit) || Number(b.periods_per_credit) <= 0)) errors.push({ field: 'periods_per_credit', message: 'periods_per_credit must be a positive integer' });
  if (b.weekdays !== undefined) {
    if (!Array.isArray(b.weekdays)) errors.push({ field: 'weekdays', message: 'weekdays must be an array' });
    else {
      for (const [i, w] of (b.weekdays || []).entries()) {
        if (!isPositiveInt(w) || w < 1 || w > 7) errors.push({ field: `weekdays[${i}]`, message: 'weekday must be 1..7' });
      }
    }
  }
  if (b.preferred_slots !== undefined) {
    if (!Array.isArray(b.preferred_slots)) errors.push({ field: 'preferred_slots', message: 'preferred_slots must be an array' });
    else {
      for (const [i, s] of (b.preferred_slots || []).entries()) {
        if (!isPositiveInt(s) || s < 1 || s > 13) errors.push({ field: `preferred_slots[${i}]`, message: 'slot must be 1..13' });
      }
    }
  }

  req._courseScheduleValidation = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req._courseScheduleValidation || [];
  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { createRules, updateRules, validate, autoCreateRules };
