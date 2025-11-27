/**
 * Model: OfficeClass
 * Mục đích: Lưu thông tin lớp (office class) do 1 Teacher chủ nhiệm trong 1 AcademicYear.
 * Quan hệ: belongsTo Teacher, belongsTo AcademicYear, hasMany Student.
 */
module.exports = (sequelize, DataTypes) => {
  const OfficeClass = sequelize.define('OfficeClass', {
    office_class_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    office_class_SKU: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    office_class_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    academic_year_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    major_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'office_classes',
    timestamps: false,
  });

  return OfficeClass;
};
