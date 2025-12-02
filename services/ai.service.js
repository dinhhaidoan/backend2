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
const generateQuestionsByTopic = async (topic, difficulty, count, questionType, mixOptions = []) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // --- LOGIC XỬ LÝ PROMPT LINH HOẠT ---
    let typeInstruction = "";
    
    if (questionType === 'mixed') {
      // Nếu có gửi danh sách mixOptions (ví dụ: ['code', 'mcq'])
      if (Array.isArray(mixOptions) && mixOptions.length > 0) {
        const mapLabels = {
          'mcq': 'Trắc nghiệm (mcq)',
          'essay': 'Tự luận (essay)',
          'code': 'Lập trình (code)'
        };
        // Tạo chuỗi mô tả: "Trắc nghiệm (mcq) và Lập trình (code)"
        const typesText = mixOptions.map(t => mapLabels[t]).filter(Boolean).join(' và ');
        typeInstruction = `Tạo hỗn hợp các loại câu hỏi chỉ bao gồm: ${typesText}. Hãy phân bổ số lượng hợp lý.`;
      } else {
        // Mặc định nếu không gửi mixOptions thì tạo cả 3
        typeInstruction = "Tạo hỗn hợp đầy đủ các loại câu hỏi: Trắc nghiệm (mcq), Tự luận (essay) và Lập trình (code).";
      }
    } else if (questionType === 'code') {
      typeInstruction = "Chỉ tạo câu hỏi bài tập Lập trình (code).";
    } else {
      typeInstruction = `Chỉ tạo câu hỏi loại ${questionType}.`;
    }

    const prompt = `
      Bạn là chuyên gia giáo dục và lập trình viên giỏi. Hãy soạn bộ đề thi theo yêu cầu sau:
      
      1. Chủ đề: "${topic}"
      2. Độ khó: "${difficulty}"
      3. Tổng số lượng câu: ${count}
      4. Yêu cầu loại câu hỏi: ${typeInstruction}

      QUAN TRỌNG - FORMAT JSON OUTPUT (Mảng các object):
      [
        {
          "question_type": "mcq" | "essay" | "code",
          "content": "Nội dung câu hỏi...",
          "max_score": 10,
          "suggested_skill_tags": ["Tag1", "Tag2"],
          "ai_rubric": [ {"criteria": "...", "points": 1} ]
          // Dữ liệu riêng cho MCQ (nếu type là mcq)
          "options": ["A...", "B...", "C...", "D..."],
          "correct_index": 0,

          // Dữ liệu riêng cho CODE (nếu type là code)
          "code_lang": "javascript", // hoặc ngôn ngữ phù hợp chủ đề
          "code_test_cases": [
             { "input": "...", "output": "..." },
             { "input": "...", "output": "..." }
          ]
        }
      ]
      Lưu ý: Chỉ trả về JSON thuần túy, không dùng markdown code block.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return [];
  }
};

// --- Hàm Chat với AI (Conversational) ---
const chatWithAI = async (userMessage, history = []) => {
  try {
    // Sử dụng model gemini-2.0-flash như các hàm khác
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Map history từ FE (thường là { role: 'user'/'assistant', content: '...' }) 
    // sang format của Gemini ({ role: 'user'/'model', parts: [{ text: '...' }] })
    const formattedHistory = history.map(msg => ({
      role: (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user',
      parts: [{ text: msg.content || msg.text || "" }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 2000,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Chat Error:", error);
    if (error.status === 429) {
      throw new Error("Hệ thống đang quá tải (Rate Limit), vui lòng thử lại sau.");
    }
    throw new Error("Không thể phản hồi tin nhắn lúc này.");
  }
};

module.exports = { 
  generateRubric,
  gradeSubmission,
  analyzeMCQ,
  generateTestCases,
  gradeCode,
  generateQuestionsByTopic,
  chatWithAI
};