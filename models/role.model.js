/**
 * Model: Role
 * Mục đích: Định nghĩa các vai trò (role) trong hệ thống (ví dụ: Sinh viên, Giảng viên, Admin).
 * Quan hệ: 1 Role có thể có nhiều User (hasMany).
 */
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    role_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Đảm bảo tên role không trùng
    },
    role_description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'roles',
    timestamps: false,
  });

  /**
   * Safe seed default roles
   * - Chỉ insert khi chưa tồn tại role_name
   * - Không cố định role_id, để sequence tự tăng
   */
  Role.seedDefaultRoles = async () => {
    const defaultRoles = [
      { role_name: 'Sinh viên', role_description: 'Sinh viên hệ chính quy' },
      { role_name: 'Giảng viên', role_description: 'Giảng viên giảng dạy' },
      { role_name: 'Giáo vụ khoa', role_description: 'Quản lý chương trình học' },
      { role_name: 'Quản trị viên', role_description: 'Admin hệ thống' },
    ];

    for (const role of defaultRoles) {
      await Role.findOrCreate({
        where: { role_name: role.role_name }, // check theo tên role
        defaults: role,
      });
    }
  };

  return Role;
};
