module.exports = (sequelize, DataTypes) => {
  const Submission = sequelize.define('Submission', {
    submission_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    assignment_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.FLOAT, allowNull: true }, // Điểm tổng
    feedback: { type: DataTypes.TEXT, allowNull: true }, // Nhận xét chung của AI/GV
    submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'submissions',
    timestamps: false,
  });
  return Submission;
};