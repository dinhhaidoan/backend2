/**
 * Model: Staff
 * Mục đích: Hồ sơ giáo vụ khoa (những tài khoản không phải giảng viên/sinh viên), liên kết tới User.
 * Quan hệ: belongsTo User (user_id).
 */
module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define('Staff', {
    staff_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    staff_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    staff_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    staff_birthdate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    staff_gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },  
  }, {
    tableName: 'staffs',
    timestamps: false,
  });

  return Staff;
};
