/**
 * Model: Room (Phòng học)
 * Purpose: stores room definitions for floors and bases; provides a seeded dataset.
 * Naming convention: A.xyz where A is base (L/S/M), x is floor number, yz is room number (two digits)
 */
module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define('Room', {
    room_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    floor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    room_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    room_code: { // formatted string like 'L.105'
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    room_name: { // optional friendly name
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'rooms',
    timestamps: false,
  });

  Room.seedDefaults = async () => {
    const Base = sequelize.models.Base;
    const Floor = sequelize.models.Floor;
    if (!Base || !Floor) {
      throw new Error('Base and Floor models must be initialized before seeding rooms.');
    }

    const floors = await Floor.findAll({ include: [{ model: Base, attributes: ['base_code'] }] });

    for (const f of floors) {
      const baseCode = (f.Base && f.Base.base_code) ? f.Base.base_code : 'X';
      const floorNum = f.floor_number;
      const maxRooms = (floorNum === 4) ? 5 : 12;

      for (let rn = 1; rn <= maxRooms; rn++) {
        const rn2 = String(rn).padStart(2, '0');
        const code = `${baseCode}.${floorNum}${rn2}`;
        const roomName = `${code}`;
        await Room.upsert({
            base_id: f.base_id,
            floor_id: f.floor_id,
            room_number: rn,
            room_code: code,
            room_name: roomName,
        });

      }
    }
  };

  return Room;
};
