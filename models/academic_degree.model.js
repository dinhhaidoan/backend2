/**
 * Model: AcademicDegree
 * Mục đích: Lưu các học vị/chức danh học thuật (ví dụ: ThS, TS) dùng cho giảng viên.
 * Quan hệ: 1 AcademicDegree có thể được gán cho nhiều Teacher (hasMany).
 */
module.exports = (sequelize, DataTypes) => {
  const AcademicDegree = sequelize.define('AcademicDegree', {
    academic_degree_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    academic_degree_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'academic_degrees',
    timestamps: false,
  });
  /**
   * Các học hàm / học vị mặc định (hardcoded) vì ít thay đổi.
   * Sử dụng AcademicDegree.DEFAULTS để đọc, hoặc gọi AcademicDegree.seedDefaults() để tạo nếu chưa có.
   */
  const DEFAULTS = [
    { academic_degree_name: 'Thạc sĩ' },
    { academic_degree_name: 'Tiến sĩ' },
    { academic_degree_name: 'Phó giáo sư' },
    { academic_degree_name: 'Giáo sư' },
  ];

  // gắn vào model để các phần khác của ứng dụng có thể tái sử dụng
  AcademicDegree.DEFAULTS = DEFAULTS;

  /**
   * Seed mặc định: tạo các bản ghi nếu chưa tồn tại (kiểm tra theo tên).
   * Lưu ý: cần đảm bảo bảng đã được sync trước khi gọi.
   */
  AcademicDegree.seedDefaults = async function seedDefaults() {
    for (const item of DEFAULTS) {
      // findOrCreate theo tên để tránh trùng
      // trả về [instance, created]
      // eslint-disable-next-line no-await-in-loop
      await this.findOrCreate({ where: { academic_degree_name: item.academic_degree_name }, defaults: item });
    }
  };

  return AcademicDegree;
};
