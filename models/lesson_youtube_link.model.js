/**
 * Model: LessonYoutubeLink
 * Stores a YouTube link and optional label for a lesson
 */
module.exports = (sequelize, DataTypes) => {
  const LessonYoutubeLink = sequelize.define('LessonYoutubeLink', {
    lesson_youtube_link_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lesson_youtube_link_lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'lesson_id',
    },
    lesson_youtube_link_label: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'label',
    },
    lesson_youtube_link_url: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'url',
    }
  }, {
    tableName: 'lesson_youtube_links',
    timestamps: false,
  });

  return LessonYoutubeLink;
};
