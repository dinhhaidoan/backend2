/**
 * Model: Lesson
 * Mục đích: Hồ sơ bài học cho một CourseClass (lớp học) — cho phép giảng viên nhập bài học, ngày, thời lượng, trạng thái, mô tả, và các liên kết (meet, youtube, drive).
 */
module.exports = (sequelize, DataTypes) => {
  const Lesson = sequelize.define('Lesson', {
    lesson_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lesson_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    course_class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lesson_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    lesson_duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lesson_status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft',
      field: 'status',
    },
    lesson_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lesson_meet_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updated_at'
    }
  }, {
    tableName: 'lessons',
    timestamps: false,
  });

  return Lesson;
};
