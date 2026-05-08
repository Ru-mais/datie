require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const matchRoutes = require('./routes/matchRoutes');

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000', // Next.js frontend
  credentials: true,
}));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/matches', matchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'active', message: 'MalluLove API is running' });
});

// Database connection
const PORT = process.env.PORT || 5000;
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
