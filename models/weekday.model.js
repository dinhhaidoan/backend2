/**
 * Model: Weekday (Thứ trong tuần)
 * Purpose: store fixed weekdays with IDs 1..7
 */
module.exports = (sequelize, DataTypes) => {
  const Weekday = sequelize.define('Weekday', {
    weekday_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    weekday_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    weekday_short: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'weekdays',
    timestamps: false,
  });

  Weekday.seedDefaults = async function seedDefaults() {
    const defaults = [
      { weekday_id: 1, weekday_name: 'Thứ 2', weekday_short: 'T2' },
      { weekday_id: 2, weekday_name: 'Thứ 3', weekday_short: 'T3' },
      { weekday_id: 3, weekday_name: 'Thứ 4', weekday_short: 'T4' },
      { weekday_id: 4, weekday_name: 'Thứ 5', weekday_short: 'T5' },
      { weekday_id: 5, weekday_name: 'Thứ 6', weekday_short: 'T6' },
      { weekday_id: 6, weekday_name: 'Thứ 7', weekday_short: 'T7' },
      { weekday_id: 7, weekday_name: 'Chủ nhật', weekday_short: 'CN' },
    ];
    for (const item of defaults) {
      // eslint-disable-next-line no-await-in-loop
      await Weekday.findOrCreate({ where: { weekday_id: item.weekday_id }, defaults: item });
    }
  };

  return Weekday;
};
