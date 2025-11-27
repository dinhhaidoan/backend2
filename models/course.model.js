/**
 * Model: Course
 * Mục đích: Lưu chương trình đào tạo (môn học) - dùng để xây dựng các lớp môn học sau này.
 * - course_SKU: mã môn học (SKU) (không đánh đồng với id)
 * - course_name_vn: tên tiếng Việt
 * - course_name_en: tên tiếng Anh
 * - credits: số tín chỉ
 * - course_type: 'required' | 'elective' (mặc định 'required')
 * - semester_id: tham chiếu tới Semester (nếu có)
 * - description: mô tả môn
 */
module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    course_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_SKU: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    course_name_vn: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    course_name_en: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    course_type: {
      type: DataTypes.ENUM('required', 'elective'),
      allowNull: false,
      defaultValue: 'required',
    },
    semester_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'courses',
    timestamps: false,
  });

  return Course;
};
