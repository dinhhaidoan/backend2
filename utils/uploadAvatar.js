const multer = require('multer');

// use memory storage because we'll upload directly to Cloudinary from buffer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Only JPEG, PNG, WEBP allowed.'), false);
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB max

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;