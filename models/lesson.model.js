/**
 * Model: Lesson
 * Mục đích: Đại diện cho 1 buổi học, liên kết với CourseClass
 */
module.exports = (sequelize, DataTypes) => {
  const Lesson = sequelize.define('Lesson', {
    lesson_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lesson_course_class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'course_class_id'
    },
    lesson_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lesson_date: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'date'
    },
    lesson_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration_in_minutes'
    },
    lesson_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'draft', // draft, published
      field: 'status'
    },
    lesson_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description'
    },
    lesson_google_meet_link: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'google_meet_link'
    },
    lesson_created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    lesson_updated_at: {
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
