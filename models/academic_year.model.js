/**
 * Model: AcademicYear
 * Mục đích: Lưu thông tin khóa học (tên, ngày bắt đầu, ngày kết thúc).
 * Quan hệ: 1 AcademicYear có thể có nhiều Student và nhiều OfficeClass.
 */
module.exports = (sequelize, DataTypes) => {
  const AcademicYear = sequelize.define('AcademicYear', {
    academic_year_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    academic_year_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    academic_year_start: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    academic_year_end: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'academic_years',
    timestamps: false,
  });

  return AcademicYear;
};
