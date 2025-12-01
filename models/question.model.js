module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
    question_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false, // Nội dung câu hỏi
    },
    question_type: {
      type: DataTypes.ENUM('essay', 'mcq', 'code'),
      defaultValue: 'essay',
    },
    max_score: {
      type: DataTypes.FLOAT,
      defaultValue: 10,
    },
    // Quan trọng: Lưu Rubric mà AI sinh ra ở đây
    ai_rubric: {
      type: DataTypes.JSON, 
      allowNull: true,
    },
    // Skill tags để sau này phân tích điểm yếu (ví dụ: ["OOP", "Inheritance"])
    skill_tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    mcq_options: { 
      type: DataTypes.JSON, 
      allowNull: true 
    },
    // Lưu chỉ số của đáp án đúng (0, 1, 2 hoặc 3). VD: 1 nghĩa là đáp án B đúng.
    mcq_correct_index: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    code_lang: { 
      type: DataTypes.STRING, 
      allowNull: true 
    }, 
    // Lưu bộ test cases (AI sinh ra hoặc GV nhập)
    // VD: [ {input: "2 3", output: "5"}, {input: "10 5", output: "15"} ]
    code_test_cases: { 
      type: DataTypes.JSON, 
      allowNull: true 
    },
  }, {
    tableName: 'questions',
    timestamps: false,
  });

  return Question;
};