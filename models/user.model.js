/**
 * Model: User
 * Mục đích: Tài khoản người dùng hệ thống (login). Chứa thông tin đăng nhập, email, role.
 * Quan hệ: belongsTo Role; 1 User có thể liên kết tới 1 Student/Teacher/Staff/Admin (hasOne).
 */
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    user_password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    user_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'users',
    timestamps: false,
  });

  return User;
};
