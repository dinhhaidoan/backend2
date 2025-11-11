require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: '1d', // token hết hạn 1 ngày
  cookieName: 'token', // tên cookie lưu JWT
};
