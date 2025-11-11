/**
 * Model: Admin
 * Mục đích: Thông tin hồ sơ của quản trị viên hệ thống (profile admin).
 * Quan hệ: thuộc về 1 User (belongsTo User) - lưu user_id để liên kết.
 * Lưu ý: file hiện có 2 trường `user_id` (cần kiểm tra nếu đây là lỗi sao chép).
 */
module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('Admin', {
    admin_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    admin_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin_birthdate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    admin_gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'admins',
    timestamps: false,
  });

  return Admin;
};
