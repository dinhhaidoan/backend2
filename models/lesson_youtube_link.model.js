/**
 * Model: LessonYoutubeLink
 * Mục đích: lưu một hoặc nhiều liên kết youtube cho mỗi bài học
 */
module.exports = (sequelize, DataTypes) => {
  const LessonYoutubeLink = sequelize.define('LessonYoutubeLink', {
    lesson_youtube_id: {
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
    tableName: 'lesson_youtube_links',
    timestamps: false,
  });

  return LessonYoutubeLink;
};
