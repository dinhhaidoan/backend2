const { chatWithAI } = require('../services/ai.service');

exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Vui lòng nhập tin nhắn." });
    }

    // history là mảng tùy chọn: [{ role: 'user', content: '...' }, ...]
    const reply = await chatWithAI(message, history || []);

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
