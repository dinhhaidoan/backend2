/**
 * Model: Major
 * Mục đích: Lưu thông tin ngành học/chuyên ngành (major) cho sinh viên.
 * Quan hệ: 1 Major có thể có nhiều Student (hasMany).
 */
module.exports = (sequelize, DataTypes) => {
  const Major = sequelize.define('Major', {
    major_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    major_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'majors',
    timestamps: false,
  });

  return Major;
};
