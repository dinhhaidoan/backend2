/**
 * Junction model for Course <-> Major (many-to-many)
 */
module.exports = (sequelize, DataTypes) => {
  const CourseMajor = sequelize.define('CourseMajor', {
    course_major_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    major_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'course_majors',
    timestamps: false,
  });

  return CourseMajor;
};
