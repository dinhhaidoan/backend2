/**
 * Model: Position
 * Mục đích: Lưu các chức danh/ vị trí công tác (ví dụ: Trưởng khoa, Phó khoa) cho Teacher.
 * Quan hệ: 1 Position có thể được gán cho nhiều Teacher (hasMany).
 */
module.exports = (sequelize, DataTypes) => {
  const Position = sequelize.define('Position', {
    position_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    position_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'positions',
    timestamps: false,
  });
  // Các vị trí/chức vụ mặc định (hardcoded)
  const DEFAULTS = [
    { position_name: 'Giảng viên' },
    { position_name: 'Trưởng chuyên ngành' },
    { position_name: 'Phó Khoa' },
    { position_name: 'Trưởng Khoa' },
  ];

  // gắn mảng mặc định vào model để dễ truy cập
  Position.DEFAULTS = DEFAULTS;

  /**
   * Seed mặc định cho bảng positions. Tạo nếu chưa tồn tại (theo position_name).
   * Ghi chú: đảm bảo đã gọi sequelize.sync() trước khi seed.
   */
  Position.seedDefaults = async function seedDefaults() {
    for (const item of DEFAULTS) {
      // eslint-disable-next-line no-await-in-loop
      await this.findOrCreate({ where: { position_name: item.position_name }, defaults: item });
    }
  };

  return Position;
};
