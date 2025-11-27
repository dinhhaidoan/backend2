require('dotenv').config();

const express = require('express');
// socket removed — no socket dependencies
const cors = require('cors');
const cookieParser = require('cookie-parser');
// jwt import not needed here
const { initDb, models } = require('./models/index.model'); // import sequelize + models + initDb
const mainRoute = require('./routes/main.route');
const { secret } = require('./config/jwt');

const app = express();
// start express app directly
const PORT = process.env.PORT || 3000;

// socket features removed

// -------------------- Middleware --------------------
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://fe-hoctapnoibo-kcntt.vercel.app',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// -------------------- Routes --------------------
app.use('/api', mainRoute);

// no realtime features left

// -------------------- Start Server --------------------
(async () => {
  try {
    // 1. Khởi tạo DB: sync + seed safe
    await initDb();

    // 2. Start server sau khi DB đã sẵn sàng
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1); // dừng server nếu DB fail
  }
})();
