/**
 * Model: NoteTagMap
 * Mục đích: Bảng nối many-to-many giữa Note và NoteTag
 */
module.exports = (sequelize, DataTypes) => {
  const NoteTagMap = sequelize.define('NoteTagMap', {
    note_tag_map_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    note_tag_map_note_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'note_id',
    },
    note_tag_map_note_tag_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'note_tag_id',
    },
  }, {
    tableName: 'note_tag_maps',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['note_id', 'note_tag_id'], name: 'uniq_ntm' }
    ]
  });

  return NoteTagMap;
};
