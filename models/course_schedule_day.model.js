/**
 * Model: CourseScheduleDay
 * Purpose: store weekdays for a CourseSchedule block
 */
module.exports = (sequelize, DataTypes) => {
  const CourseScheduleDay = sequelize.define('CourseScheduleDay', {
    day_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    weekday_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 7,
      },
    },
  }, {
    tableName: 'course_schedule_days',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['schedule_id', 'weekday_id'],
      }
    ],
  });

  return CourseScheduleDay;
};
