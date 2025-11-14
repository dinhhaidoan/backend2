/**
 * Model: NoteTag
 * Mục đích: Tag do user tạo, scope theo user_id
 */
module.exports = (sequelize, DataTypes) => {
  const NoteTag = sequelize.define('NoteTag', {
    note_tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    note_tag_name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'name',
    },
    note_tag_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    note_tag_color: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'color',
    },
    note_tag_created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at',
    },
    note_tag_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updated_at',
    },
  }, {
    tableName: 'note_tags',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['user_id', 'name'], name: 'uniq_nt_user_name' }
    ]
  });

  return NoteTag;
};
