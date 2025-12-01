module.exports = (sequelize, DataTypes) => {
  const SubmissionDetail = sequelize.define('SubmissionDetail', {
    submission_detail_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    submission_id: { type: DataTypes.INTEGER, allowNull: false },
    question_id: { type: DataTypes.INTEGER, allowNull: false },
    
    student_answer: { type: DataTypes.TEXT }, // Câu trả lời gốc của SV
    
    ai_score: { type: DataTypes.FLOAT }, // Điểm AI chấm
    ai_feedback: { type: DataTypes.TEXT }, // Nhận xét của AI
    ai_error_tags: { type: DataTypes.JSON }, // ["Sai cú pháp", "Hiểu sai concept"] -> QUAN TRỌNG ĐỂ THỐNG KÊ
    
    // Cho phép giảng viên sửa điểm sau này
    final_score: { type: DataTypes.FLOAT }, 
    selected_option_index: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
  },
   {
    tableName: 'submission_details',
    timestamps: false,
  });
  return SubmissionDetail;
};