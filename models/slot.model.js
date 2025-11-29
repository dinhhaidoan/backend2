/**
 * Model: Slot (Tiết học)
 * Purpose: store slot time definitions (1..13) with start/end times
 */
module.exports = (sequelize, DataTypes) => {
  const Slot = sequelize.define('Slot', {
    slot_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    slot_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  }, {
    tableName: 'slots',
    timestamps: false,
  });

  Slot.seedDefaults = async function seedDefaults() {
    const defaults = [
      { slot_id: 1, slot_number: 1, start_time: '07:00:00', end_time: '07:45:00' },
      { slot_id: 2, slot_number: 2, start_time: '07:50:00', end_time: '08:35:00' },
      { slot_id: 3, slot_number: 3, start_time: '08:40:00', end_time: '09:25:00' },
      { slot_id: 4, slot_number: 4, start_time: '09:35:00', end_time: '10:20:00' },
      { slot_id: 5, slot_number: 5, start_time: '10:25:00', end_time: '11:10:00' },
      { slot_id: 6, slot_number: 6, start_time: '13:00:00', end_time: '13:45:00' },
      { slot_id: 7, slot_number: 7, start_time: '13:50:00', end_time: '14:35:00' },
      { slot_id: 8, slot_number: 8, start_time: '14:40:00', end_time: '15:25:00' },
      { slot_id: 9, slot_number: 9, start_time: '15:35:00', end_time: '16:20:00' },
      { slot_id: 10, slot_number: 10, start_time: '16:25:00', end_time: '17:10:00' },
      { slot_id: 11, slot_number: 11, start_time: '18:00:00', end_time: '18:45:00' },
      { slot_id: 12, slot_number: 12, start_time: '18:50:00', end_time: '19:35:00' },
      { slot_id: 13, slot_number: 13, start_time: '19:40:00', end_time: '20:25:00' },
    ];

    for (const item of defaults) {
      // eslint-disable-next-line no-await-in-loop
      await Slot.findOrCreate({ where: { slot_id: item.slot_id }, defaults: item });
    }
  };

  return Slot;
};
