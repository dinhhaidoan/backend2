/**
 * Model: ParentStudent
 * Mục đích: Lưu thông tin phụ huynh/người thân liên quan tới 1 Student.
 * Quan hệ: belongsTo Student; Student có thể có nhiều ParentStudent.
 */
module.exports = (sequelize, DataTypes) => {
  const ParentStudent = sequelize.define('ParentStudent', {
    parent_student_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parent_name: {
      type: DataTypes.STRING,
      allowNull: false,
    }, 
    parent_relationship: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parent_contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'parent_students',
    timestamps: false,
  });

  return ParentStudent;
};
