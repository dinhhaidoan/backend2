module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define('Assignment', {
    assignment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('essay', 'mcq', 'code', 'mixed'),
      defaultValue: 'essay',
    },
    // Trạng thái: draft (nháp), published (đã giao), closed (hết hạn)
    status: {
      type: DataTypes.ENUM('draft', 'published', 'closed'),
      defaultValue: 'draft',
    },
  }, {
    tableName: 'assignments',
    timestamps: true, // Cần timestamps để biết ngày tạo
  });

  return Assignment;
};