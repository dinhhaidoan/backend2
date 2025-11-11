/**
 * Model: Teacher
 * Mục đích: Hồ sơ giảng viên, lưu thông tin cá nhân và liên kết tới User, AcademicDegree, Position.
 * Quan hệ: belongsTo User, AcademicDegree, Position; có thể có nhiều OfficeClass.
 */
module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define('Teacher', {
    teacher_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    teacher_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacher_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacher_birthdate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    teacher_gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    teacher_days_of_joining: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    teacher_active: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: true,
    },
    teacher_notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    academic_degree_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    position_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'teachers',
    timestamps: false,
  });

  return Teacher;
};
