// check-models.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function check() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("❌ Chưa đọc được GEMINI_API_KEY. Kiểm tra lại file .env");
    return;
  }
  
  console.log("🔑 Đang kiểm tra Key:", apiKey.substring(0, 10) + "...");

  try {
    // Dùng fetch trực tiếp để liệt kê model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.error) {
      console.error("❌ Lỗi từ Google:", data.error.message);
      return;
    }

    console.log("✅ KẾT NỐI THÀNH CÔNG! Danh sách model bạn được dùng:");
    if (data.models) {
      data.models.forEach(m => {
        // Chỉ lấy model hỗ trợ tạo nội dung (generateContent)
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`   👉 ${m.name.replace('models/', '')}`);
        }
      });
    } else {
      console.log("⚠️ Không tìm thấy model nào. Tài khoản này có thể bị hạn chế.");
    }
  } catch (err) {
    console.error("❌ Lỗi mạng/code:", err.message);
  }
}

check();