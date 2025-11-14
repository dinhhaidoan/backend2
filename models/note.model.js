/**
 * Model: Note
 * Mục đích: Hồ sơ ghi chú của user
 */
module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define('Note', {
    note_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    note_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    note_content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    note_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    note_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    note_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'draft', // draft, done, active
      field: 'status',
    },
    note_priority: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'medium', // low, medium, high
      field: 'priority',
    },
    note_is_favorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_favorite',
    },
    note_is_archived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_archived',
    },
    note_created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    note_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updated_at',
    },
  }, {
    tableName: 'notes',
    timestamps: false,
  });

  return Note;
};
