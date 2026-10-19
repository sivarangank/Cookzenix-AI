require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');

const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const favoriteRoutes = require('./routes/favorites');
const chatbotRoutes = require('./routes/chatbot');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai', chatbotRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'CookZenix AI API is running!',
    version: '1.0.0'
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
==================================================
🍽️  CookZenix AI Backend Server
📡 Running on http://localhost:${PORT}
💾 Database: SQLite (food_recipes.db)
🤖 FoodieBot: Ready
==================================================
  `);
});

module.exports = app;
