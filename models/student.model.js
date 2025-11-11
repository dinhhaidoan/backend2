/**
 * Model: Student
 * Mục đích: Hồ sơ sinh viên, lưu thông tin cá nhân và liên kết tới User, Major, OfficeClass, AcademicYear.
 * Quan hệ: belongsTo User, Major, OfficeClass, AcademicYear; có nhiều ParentStudent.
 */
module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    student_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    student_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    student_birthdate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    student_gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    student_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    student_CCCD: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    student_place_of_birth: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    student_day_joined: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    student_year_expected: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    academic_year_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    major_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    office_class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    student_active: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: true,
    },
    
  }, {
    tableName: 'students',
    timestamps: false,
  });

  return Student;
};
