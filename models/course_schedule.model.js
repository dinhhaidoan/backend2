/**
 * Model: CourseSchedule (block lịch)
 * Purpose: Represent schedule blocks for CourseClass (study or exam)
 */
module.exports = (sequelize, DataTypes) => {
  const CourseSchedule = sequelize.define('CourseSchedule', {
    schedule_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    schedule_type: {
      type: DataTypes.ENUM('study', 'exam'),
      allowNull: false,
      defaultValue: 'study',
    },
    group_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    repeat_type: {
      type: DataTypes.ENUM('none', 'weekly', 'custom_weeks'),
      allowNull: false,
      defaultValue: 'none',
    },
    repeat_weeks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'course_schedules',
    timestamps: true,
    underscored: true,
  });

  return CourseSchedule;
};
