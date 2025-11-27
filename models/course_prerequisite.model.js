/**
 * Junction model for Course prerequisites (self-referential many-to-many)
 */
module.exports = (sequelize, DataTypes) => {
  const CoursePrerequisite = sequelize.define('CoursePrerequisite', {
    course_prereq_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    prereq_course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'course_prerequisites',
    timestamps: false,
  });

  return CoursePrerequisite;
};
