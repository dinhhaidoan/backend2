/**
 * Model: CourseScheduleSlot
 * Purpose: store slots for a CourseScheduleDay
 */
module.exports = (sequelize, DataTypes) => {
  const CourseScheduleSlot = sequelize.define('CourseScheduleSlot', {
    slot_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    day_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    slot_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 13,
      },
    },
    slot_ref_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'course_schedule_slots',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['day_id', 'slot_number'],
      }
    ],
  });

  return CourseScheduleSlot;
};
