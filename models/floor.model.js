/**
 * Model: Floor (Lầu/Tầng)
 * Purpose: stores floor definitions and seeds defaults per base.
 */
module.exports = (sequelize, DataTypes) => {
  const Floor = sequelize.define('Floor', {
    floor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    floor_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    floor_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'floors',
    timestamps: false,
    indexes: [
    {
      unique: true,
      fields: ['base_id', 'floor_number']
    }
  ]
  });

  /**
   * Seed default floors for bases:
   * - L: 9 floors
   * - S: 6 floors
   * - M: 4 floors
   */
  Floor.seedDefaults = async () => {
    const Base = sequelize.models.Base;
    if (!Base) {
      throw new Error('Base model not initialized; create Base before Floor seeding.');
    }

    const baseCounts = [
      { code: 'L', floors: 9 },
      { code: 'S', floors: 6 },
      { code: 'M', floors: 4 },
    ];

    for (const bc of baseCounts) {
      const base = await Base.findOne({ where: { base_code: bc.code } });
      if (!base) continue;

      for (let i = 1; i <= bc.floors; i++) {
        const floorName = `${bc.code}.T${i}`;
        await Floor.upsert({
            base_id: base.base_id,
            floor_number: i,
            floor_name: floorName,
        });
      }
    }
  };

  return Floor;
};
