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
  /**
   * Seed default majors (idempotent)
   * - Sử dụng findOrCreate để tránh duplicate
   */
  Major.seedDefaults = async () => {
    const defaultMajors = [
      'Khoa học Máy tính',
      'Kỹ thuật Phần mềm',
      'Hệ thống Thông tin',
      'Mạng Máy tính và Truyền thông',
      'An toàn Thông tin',
      'Khoa học Dữ liệu',
      'Trí tuệ Nhân tạo',
      'IoT và Hệ thống Nhúng'
    ];

    for (const name of defaultMajors) {
      await Major.findOrCreate({ where: { major_name: name }, defaults: { major_name: name } });
    }
  };

  return Major;
};
