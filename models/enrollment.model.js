/**
 * Model: Enrollment (Ghi danh)
 * Mục đích: ghi danh sinh viên vào CourseClass, có thể thuộc nhóm thực hành.
 * - student_id: khóa ngoại tới Student
 * - course_class_id: khóa ngoại tới CourseClass
 * - group_id: khóa ngoại tới Group (optional, nếu lớp có nhóm)
 * - status: trạng thái ghi danh ('enrolled', 'dropped')
 * - enrolled_at: thời gian ghi danh
 */
module.exports = (sequelize, DataTypes) => {
  const Enrollment = sequelize.define('Enrollment', {
    enrollment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    course_class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('enrolled', 'dropped'),
      allowNull: false,
      defaultValue: 'enrolled',
    },
    enrolled_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'enrollments',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['student_id', 'course_class_id'], // một sinh viên chỉ enroll một lần vào một lớp
      },
      {
        fields: ['course_class_id', 'group_id'], // để query nhanh enrollments theo group
      },
    ],
  });

  return Enrollment;
};