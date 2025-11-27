/**
 * Model: Base (Cơ sở)
 * Purpose: stores campus/base information (L, S, M) and provides seed data.
 */
module.exports = (sequelize, DataTypes) => {
  const Base = sequelize.define('Base', {
    base_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    base_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    base_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'bases',
    timestamps: false,
  });

  Base.seedDefaults = async () => {
    const defaults = [
      { base_code: 'L', base_name: 'Cơ sở L' },
      { base_code: 'S', base_name: 'Cơ sở S' },
      { base_code: 'M', base_name: 'Cơ sở M' },
    ];

    for (const b of defaults) {
      await Base.findOrCreate({ where: { base_code: b.base_code }, defaults: b });
    }
  };

  return Base;
};
