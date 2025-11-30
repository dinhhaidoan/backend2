const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const isValidStatus = (s) => ['draft','published'].includes(String(s));
const isValidUrl = (u) => {
  if (!u) return false;
  try { new URL(String(u)); return true; } catch(e) { return false; }
};

const createRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.course_class_id || !isPositiveInt(b.course_class_id)) errors.push({ field: 'course_class_id', message: 'course_class_id is required and must be a positive integer' });
  if (!b.lesson_title || String(b.lesson_title).trim() === '') errors.push({ field: 'lesson_title', message: 'lesson_title is required' });
  if (!b.lesson_date || isNaN(Date.parse(b.lesson_date))) errors.push({ field: 'lesson_date', message: 'lesson_date is required and must be a valid date' });
  if (b.lesson_duration_minutes !== undefined && b.lesson_duration_minutes !== null && b.lesson_duration_minutes !== '') {
    if (!isPositiveInt(b.lesson_duration_minutes)) errors.push({ field: 'lesson_duration_minutes', message: 'lesson_duration_minutes must be a positive integer or null' });
  }
  if (b.lesson_status !== undefined && b.lesson_status !== null) {
    if (!isValidStatus(b.lesson_status)) errors.push({ field: 'lesson_status', message: 'lesson_status must be draft or published' });
  }
  // validate meet link
  if (b.lesson_meet_link !== undefined && b.lesson_meet_link !== null && String(b.lesson_meet_link).trim() !== '') {
    if (!isValidUrl(b.lesson_meet_link)) errors.push({ field: 'lesson_meet_link', message: 'lesson_meet_link must be a valid URL' });
  }
  // youtube_links - array of urls
  if (b.youtube_links !== undefined && b.youtube_links !== null) {
    if (!Array.isArray(b.youtube_links)) errors.push({ field: 'youtube_links', message: 'youtube_links must be an array' });
    else {
      for (const u of b.youtube_links) if (!isValidUrl(u)) errors.push({ field: 'youtube_links', message: 'one or more youtube_links are invalid URLs' });
    }
  }
  // drive_links - array of urls
  if (b.drive_links !== undefined && b.drive_links !== null) {
    if (!Array.isArray(b.drive_links)) errors.push({ field: 'drive_links', message: 'drive_links must be an array' });
    else {
      for (const u of b.drive_links) if (!isValidUrl(u)) errors.push({ field: 'drive_links', message: 'one or more drive_links are invalid URLs' });
    }
  }

  req._lessonValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (b.course_class_id !== undefined && b.course_class_id !== null) {
    if (!isPositiveInt(b.course_class_id)) errors.push({ field: 'course_class_id', message: 'course_class_id must be a positive integer' });
  }
  if (b.lesson_title !== undefined) {
    if (!b.lesson_title || String(b.lesson_title).trim() === '') errors.push({ field: 'lesson_title', message: 'lesson_title must not be empty' });
  }
  if (b.lesson_date !== undefined) {
    if (!b.lesson_date || isNaN(Date.parse(b.lesson_date))) errors.push({ field: 'lesson_date', message: 'lesson_date must be a valid date' });
  }
  if (b.lesson_duration_minutes !== undefined && b.lesson_duration_minutes !== null && b.lesson_duration_minutes !== '') {
    if (!isPositiveInt(b.lesson_duration_minutes)) errors.push({ field: 'lesson_duration_minutes', message: 'lesson_duration_minutes must be a positive integer or null' });
  }
  if (b.lesson_status !== undefined && b.lesson_status !== null) {
    if (!isValidStatus(b.lesson_status)) errors.push({ field: 'lesson_status', message: 'lesson_status must be draft or published' });
  }
  if (b.lesson_meet_link !== undefined && b.lesson_meet_link !== null && String(b.lesson_meet_link).trim() !== '') {
    if (!isValidUrl(b.lesson_meet_link)) errors.push({ field: 'lesson_meet_link', message: 'lesson_meet_link must be a valid URL' });
  }
  if (b.youtube_links !== undefined && b.youtube_links !== null) {
    if (!Array.isArray(b.youtube_links)) errors.push({ field: 'youtube_links', message: 'youtube_links must be an array' });
    else {
      for (const u of b.youtube_links) if (!isValidUrl(u)) errors.push({ field: 'youtube_links', message: 'one or more youtube_links are invalid URLs' });
    }
  }
  if (b.drive_links !== undefined && b.drive_links !== null) {
    if (!Array.isArray(b.drive_links)) errors.push({ field: 'drive_links', message: 'drive_links must be an array' });
    else {
      for (const u of b.drive_links) if (!isValidUrl(u)) errors.push({ field: 'drive_links', message: 'one or more drive_links are invalid URLs' });
    }
  }
  req._lessonValidation = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req._lessonValidation || [];
  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { createRules, updateRules, validate };
