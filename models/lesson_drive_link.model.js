/**
 * Model: LessonDriveLink
 * Stores a Drive link and optional label for a lesson
 */
module.exports = (sequelize, DataTypes) => {
  const LessonDriveLink = sequelize.define('LessonDriveLink', {
    lesson_drive_link_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lesson_drive_link_lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'lesson_id',
    },
    lesson_drive_link_label: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'label',
    },
    lesson_drive_link_url: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'url',
    }
  }, {
    tableName: 'lesson_drive_links',
    timestamps: false
  });

  return LessonDriveLink;
};
