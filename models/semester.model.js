/**
 * Model: Semester
 * Mục đích: Lưu thông tin học kỳ thuộc một khóa học (AcademicYear)
 * Fields: semester_name, semester_start (date), semester_end (date), max_credits (int)
 */
module.exports = (sequelize, DataTypes) => {
  const Semester = sequelize.define('Semester', {
    semester_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    semester_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    semester_start: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    semester_end: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    max_credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }
  }, {
    tableName: 'semesters',
    timestamps: false,
  });

  return Semester;
};
