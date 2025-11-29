/**
 * Model: Group (Nhóm thực hành)
 * Mục đích: đại diện cho nhóm thực hành trong một CourseClass, với giới hạn số lượng sinh viên.
 * - course_class_id: khóa ngoại tới CourseClass
 * - group_name: tên nhóm (e.g., "Nhóm 1", "Nhóm 2")
 * - capacity: số lượng sinh viên tối đa (default 20)
 */
module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    group_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
    },
  }, {
    tableName: 'groups',
    timestamps: false,
  });

  return Group;
};