/**
 * Model: NoteCategory
 * Mục đích: Danh mục cố định cho ghi chú (ví dụ: Học tập, Dự án, ...)
 */
module.exports = (sequelize, DataTypes) => {
  const NoteCategory = sequelize.define('NoteCategory', {
    note_category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    note_category_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'name',
    },
    note_category_description: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'description',
    },
    note_category_slug: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'slug',
    },
  }, {
    tableName: 'note_categories',
    timestamps: false,
  });

  // Seed default categories
  NoteCategory.seedDefault = async () => {
    const defaults = ['Học tập', 'Dự án', 'Tài liệu', 'Họp', 'Cá nhân'];
    for (const n of defaults) {
      await NoteCategory.findOrCreate({ where: { note_category_name: n }, defaults: { note_category_name: n } });
    }
  };

  return NoteCategory;
};
