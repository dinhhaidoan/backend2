/**
 * Model: LessonDriveLink
 * Mục đích: lưu một hoặc nhiều liên kết tài liệu Drive cho mỗi bài học
 */
module.exports = (sequelize, DataTypes) => {
  const LessonDriveLink = sequelize.define('LessonDriveLink', {
    lesson_drive_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    tableName: 'lesson_drive_links',
    timestamps: false,
  });

  return LessonDriveLink;
};
