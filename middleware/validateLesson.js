const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const isValidUrl = (v) => {
  try {
    if (!v) return false;
    const s = String(v).trim();
    if (!s) return false;
    new URL(s);
    return true;
  } catch (err) {
    return false;
  }
};

const createRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.lesson || typeof b.lesson !== 'object') {
    errors.push({ field: 'lesson', message: 'lesson object is required' });
    req._lessonValidation = errors; return next();
  }
  const l = b.lesson;
  if (!l.lesson_course_class_id || !isPositiveInt(l.lesson_course_class_id)) errors.push({ field: 'lesson_course_class_id', message: 'lesson_course_class_id is required and must be positive integer' });
  if (!l.lesson_title || String(l.lesson_title).trim() === '') errors.push({ field: 'lesson_title', message: 'lesson_title is required' });
  if (!l.lesson_date || String(l.lesson_date).trim() === '') errors.push({ field: 'lesson_date', message: 'lesson_date is required' });
  if (l.lesson_duration !== undefined && l.lesson_duration !== null && String(l.lesson_duration).trim() !== '') {
    if (!isPositiveInt(l.lesson_duration) && Number(l.lesson_duration) !== 0) errors.push({ field: 'lesson_duration', message: 'lesson_duration must be integer minutes or null' });
  }
  if (l.lesson_status && !['published','draft'].includes(String(l.lesson_status))) errors.push({ field: 'lesson_status', message: 'status must be one of published, draft' });
  if (b.youtube_links !== undefined && b.youtube_links !== null) {
    if (!Array.isArray(b.youtube_links)) errors.push({ field: 'youtube_links', message: 'youtube_links must be an array' });
    else {
      for (const item of b.youtube_links) {
        if (!item || typeof item !== 'object') { errors.push({ field: 'youtube_links', message: 'each item must be an object with url and optional label' }); continue; }
        if (!item.url || !isValidUrl(item.url)) errors.push({ field: 'youtube_links', message: `Invalid url ${item.url}` });
        if (item.label !== undefined && item.label !== null && String(item.label).trim() === '') errors.push({ field: 'youtube_links', message: 'label cannot be empty string' });
      }
    }
  }
  if (b.drive_links !== undefined && b.drive_links !== null) {
    if (!Array.isArray(b.drive_links)) errors.push({ field: 'drive_links', message: 'drive_links must be an array' });
    else {
      for (const item of b.drive_links) {
        if (!item || typeof item !== 'object') { errors.push({ field: 'drive_links', message: 'each item must be an object with url and optional label' }); continue; }
        if (!item.url || !isValidUrl(item.url)) errors.push({ field: 'drive_links', message: `Invalid url ${item.url}` });
        if (item.label !== undefined && item.label !== null && String(item.label).trim() === '') errors.push({ field: 'drive_links', message: 'label cannot be empty string' });
      }
    }
  }
  if (l.lesson_google_meet_link && !isValidUrl(l.lesson_google_meet_link)) errors.push({ field: 'lesson_google_meet_link', message: 'Invalid google_meet_link' });
  req._lessonValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (b.lesson) {
    const l = b.lesson;
    if (l.lesson_course_class_id !== undefined && l.lesson_course_class_id !== null && !isPositiveInt(l.lesson_course_class_id)) errors.push({ field: 'lesson_course_class_id', message: 'lesson_course_class_id must be a positive integer' });
    if (l.lesson_title !== undefined && (l.lesson_title === null || String(l.lesson_title).trim() === '')) errors.push({ field: 'lesson_title', message: 'lesson_title cannot be empty' });
    if (l.lesson_date !== undefined && (l.lesson_date === null || String(l.lesson_date).trim() === '')) errors.push({ field: 'lesson_date', message: 'lesson_date cannot be empty' });
    if (l.lesson_duration !== undefined && l.lesson_duration !== null && String(l.lesson_duration).trim() !== '') { if (!isPositiveInt(l.lesson_duration) && Number(l.lesson_duration) !== 0) errors.push({ field: 'lesson_duration', message: 'lesson_duration must be integer minutes or null' }); }
    if (l.lesson_status !== undefined && l.lesson_status !== null && !['published','draft'].includes(String(l.lesson_status))) errors.push({ field: 'lesson_status', message: 'status must be one of published, draft' });
    if (l.lesson_google_meet_link !== undefined && l.lesson_google_meet_link !== null && l.lesson_google_meet_link !== '' && !isValidUrl(l.lesson_google_meet_link)) errors.push({ field: 'lesson_google_meet_link', message: 'Invalid url' });
  }
  if (b.youtube_links !== undefined && b.youtube_links !== null) {
    if (!Array.isArray(b.youtube_links)) errors.push({ field: 'youtube_links', message: 'youtube_links must be an array' });
    else {
      for (const item of b.youtube_links) {
        if (!item || typeof item !== 'object') { errors.push({ field: 'youtube_links', message: 'each item must be an object with url and optional label' }); continue; }
        if (!item.url || !isValidUrl(item.url)) errors.push({ field: 'youtube_links', message: `Invalid url ${item.url}` });
        if (item.label !== undefined && item.label !== null && String(item.label).trim() === '') errors.push({ field: 'youtube_links', message: 'label cannot be empty string' });
      }
    }
  }
  if (b.drive_links !== undefined && b.drive_links !== null) {
    if (!Array.isArray(b.drive_links)) errors.push({ field: 'drive_links', message: 'drive_links must be an array' });
    else {
      for (const item of b.drive_links) {
        if (!item || typeof item !== 'object') { errors.push({ field: 'drive_links', message: 'each item must be an object with url and optional label' }); continue; }
        if (!item.url || !isValidUrl(item.url)) errors.push({ field: 'drive_links', message: `Invalid url ${item.url}` });
        if (item.label !== undefined && item.label !== null && String(item.label).trim() === '') errors.push({ field: 'drive_links', message: 'label cannot be empty string' });
      }
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
