const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Hàm sinh Rubric ---
const generateRubric = async (questionContent, maxScore) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Bạn là chuyên gia giáo dục. Hãy phân tích câu hỏi sau:
      Câu hỏi: "${questionContent}"
      Điểm tối đa: ${maxScore}
      
      Yêu cầu output JSON (không markdown):
      {
        "rubric": [
          {"criteria": "Tiêu chí 1", "points": 2, "description": "..."},
          {"criteria": "Tiêu chí 2", "points": 1, "description": "..."}
        ],
        "suggested_skill_tags": ["<Kỹ năng 1>", "<Kỹ năng 2>"]
      }
      Lưu ý: "suggested_skill_tags" là các từ khóa ngắn gọn về kiến thức cần có để trả lời câu này (Ví dụ: "OOP", "Java Loop", "History 1945").
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error (generateRubric):", error);
    return null;
  }
};
// --- Hàm chấm bài (Grade) ---
const gradeSubmission = async (questionContent, rubric, studentAnswer, maxScore) => {
  try {
    // Dùng model xịn nhất bạn đang có
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Chuyển Rubric object thành chuỗi để AI đọc
    const rubricStr = JSON.stringify(rubric);

    const prompt = `
      Bạn là giảng viên đang chấm bài thi tự luận.
      
      1. ĐỀ BÀI: "${questionContent}"
      2. THANG ĐIỂM TỐI ĐA: ${maxScore}
      3. RUBRIC CHẤM ĐIỂM (Tiêu chí): ${rubricStr}
      4. BÀI LÀM CỦA SINH VIÊN: "${studentAnswer}"

      YÊU CẦU: 
      - Chấm điểm bài làm dựa SÁT vào Rubric.
      - Nếu bài làm sai hoặc thiếu ý so với rubric, hãy trừ điểm thẳng tay.
      - Trả về kết quả dưới dạng JSON thuần túy (không markdown) theo định dạng:
      {
        "score": <số điểm chấm được (number)>,
        "feedback": "<nhận xét chi tiết, chỉ ra phần nào được điểm, phần nào mất điểm>",
        "error_tags": ["<từ khóa lỗi 1>", "<từ khóa lỗi 2>"]
      }
      Lưu ý: "error_tags" là các từ khóa ngắn về lỗi kiến thức (ví dụ: "Sai định nghĩa", "Thiếu ví dụ", "Code sai cú pháp").
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean json formatting
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error (gradeSubmission):", error);
    // Trả về điểm 0 nếu lỗi để không crash
    return { score: 0, feedback: "Lỗi khi chấm tự động: " + error.message, error_tags: ["System Error"] };
  }
};

const analyzeMCQ = async (questionContent, options) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Hoặc model bạn đang dùng

    const prompt = `
      Bạn là chuyên gia giáo dục. Hãy phân tích câu hỏi trắc nghiệm sau để gán nhãn kỹ năng:
      Câu hỏi: "${questionContent}"
      Các lựa chọn: ${JSON.stringify(options)}
      
      Yêu cầu output JSON (không markdown):
      {
        "suggested_skill_tags": ["<Kỹ năng 1>", "<Kỹ năng 2>"]
      }
      Lưu ý: Skill tags ngắn gọn (VD: "Java Loop", "History", "Math Geometry").
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error (analyzeMCQ):", error);
    return { suggested_skill_tags: [] };
  }
};

// Sinh Test Cases tự động ---
const generateTestCases = async (questionContent) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      Bạn là chuyên gia lập trình. Hãy sinh 3 bộ Test Case (Input/Output) chuẩn cho bài toán lập trình sau:
      Đề bài: "${questionContent}"
      
      Yêu cầu output JSON (không markdown):
      {
        "test_cases": [
          {"input": "...", "output": "..."},
          {"input": "...", "output": "..."}
        ],
        "suggested_skill_tags": ["Tag1", "Tag2"]
      }
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error (generateTestCases):", error);
    return null;
  }
};

// Chấm Code (Virtual Judge) ---
const gradeCode = async (questionContent, testCases, studentCode, language, maxScore) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const testCasesStr = JSON.stringify(testCases);

    const prompt = `
      Bạn là một trình chấm bài (Code Judge) thông minh.
      1. ĐỀ BÀI: "${questionContent}"
      2. NGÔN NGỮ YÊU CẦU: ${language || "Bất kỳ"}
      3. TEST CASES CHUẨN: ${testCasesStr}
      4. CODE CỦA SINH VIÊN:
      \`\`\`
      ${studentCode}
      \`\`\`

      YÊU CẦU CHẤM:
      - Kiểm tra xem code có chạy đúng logic để ra output như test case không.
      - Kiểm tra cú pháp, lỗi biên dịch (nếu có).
      - Đánh giá tối ưu (Big O).
      
      Trả về JSON (không markdown):
      {
        "score": <điểm số thực tế trên thang ${maxScore}>,
        "feedback": "<nhận xét chi tiết: lỗi sai, case nào pass/fail, gợi ý tối ưu>",
        "error_tags": ["<Lỗi biên dịch>", "<Sai logic>", "<Vòng lặp vô tận>", ...] (nếu đúng hết thì để rỗng)
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error (gradeCode):", error);
    return { score: 0, feedback: "Lỗi hệ thống chấm code", error_tags: ["System Error"] };
  }
};

// Hàm tạo bài tập tự động
const generateQuestionsByTopic = async (topic, difficulty, count, questionType) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prompt quan trọng: Phải ép AI trả về đúng cấu trúc JSON mà model Question cần
    const prompt = `
      Bạn là một giáo viên giỏi. Hãy soạn một bộ đề thi cho sinh viên IT.
      
      YÊU CẦU:
      1. Chủ đề: "${topic}"
      2. Độ khó: "${difficulty}" (Ví dụ: Cơ bản, Trung bình, Khó)
      3. Số lượng câu: ${count}
      4. Loại câu hỏi: "${questionType}" (chỉ chọn 'mcq' hoặc 'essay')

      OUTPUT JSON FORMAT (Bắt buộc, không markdown):
      [
        {
          "content": "Nội dung câu hỏi...",
          "max_score": 10,
          "question_type": "${questionType}",
          "options": ["A...", "B...", "C...", "D..."] (chỉ nếu là mcq),
          "correct_index": 0 (chỉ nếu là mcq, index của đáp án đúng),
          "suggested_skill_tags": ["Tag1", "Tag2"]
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text()
      .replace(/```json/g, '') // Clean markdown
      .replace(/```/g, '')
      .trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return []; // Trả về mảng rỗng nếu lỗi
  }
};

module.exports = { 
  generateRubric,
  gradeSubmission,
  analyzeMCQ,
  generateTestCases,
  gradeCode,
  generateQuestionsByTopic };