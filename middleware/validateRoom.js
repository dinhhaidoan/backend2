const allowedCampuses = ['L', 'M', 'S'];
const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const createRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (!b.campus || typeof b.campus !== 'string' || !allowedCampuses.includes(b.campus)) {
    errors.push({ field: 'campus', message: `campus is required and must be one of ${allowedCampuses.join(',')}` });
  }
  if (!isPositiveInt(b.floor) || Number(b.floor) < 1 || Number(b.floor) > 9) {
    errors.push({ field: 'floor', message: 'floor is required and must be an integer between 1 and 9' });
  }
  if (!isPositiveInt(b.room_number) || Number(b.room_number) < 1 || Number(b.room_number) > 12) {
    errors.push({ field: 'room_number', message: 'room_number is required and must be an integer between 1 and 12' });
  }

  // optional: room_name check
  if (b.room_name !== undefined && b.room_name !== null) {
    if (typeof b.room_name !== 'string' || !String(b.room_name).trim()) errors.push({ field: 'room_name', message: 'room_name must be a non-empty string' });
  }

  req._roomValidation = errors;
  next();
};

const updateRules = (req, res, next) => {
  const errors = [];
  const b = req.body || {};
  if (b.campus !== undefined) {
    if (!b.campus || typeof b.campus !== 'string' || !allowedCampuses.includes(b.campus)) errors.push({ field: 'campus', message: `campus must be one of ${allowedCampuses.join(',')}` });
  }
  if (b.floor !== undefined) {
    if (!isPositiveInt(b.floor) || Number(b.floor) < 1 || Number(b.floor) > 9) errors.push({ field: 'floor', message: 'floor must be an integer between 1 and 9' });
  }
  if (b.room_number !== undefined) {
    if (!isPositiveInt(b.room_number) || Number(b.room_number) < 1 || Number(b.room_number) > 12) errors.push({ field: 'room_number', message: 'room_number must be an integer between 1 and 12' });
  }
  if (b.room_name !== undefined && b.room_name !== null) {
    if (typeof b.room_name !== 'string' || !String(b.room_name).trim()) errors.push({ field: 'room_name', message: 'room_name must be a non-empty string' });
  }

  req._roomValidation = errors;
  next();
};

const validate = (req, res, next) => {
  const errors = req._roomValidation || [];
  if (errors.length) return res.status(400).json({ error: 'Validation error', details: errors });
  next();
};

module.exports = { createRules, updateRules, validate };
