const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

/**
 * Helper to safely parse JSON strings from SQLite columns
 */
function formatRecipe(row) {
  if (!row) return null;

  let ingredients = [];
  let steps = [];
  let nutrition = {};
  let tags = [];

  try {
    ingredients = typeof row.ingredients === 'string' ? JSON.parse(row.ingredients) : (row.ingredients || []);
  } catch (e) {
    ingredients = typeof row.ingredients === 'string' ? row.ingredients.split('\n').filter(Boolean) : [];
  }

  try {
    steps = typeof row.steps === 'string' ? JSON.parse(row.steps) : (row.steps || []);
  } catch (e) {
    steps = typeof row.steps === 'string' ? row.steps.split('\n').filter(Boolean) : [];
  }

  try {
    nutrition = typeof row.nutrition === 'string' ? JSON.parse(row.nutrition) : (row.nutrition || {});
  } catch (e) {
    nutrition = {};
  }

  try {
    tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []);
  } catch (e) {
    tags = [];
  }

  return {
    ...row,
    ingredients,
    steps,
    nutrition,
    tags
  };
}

/**
 * GET /api/favorites
 * Get all favorite recipes for the authenticated user
 */
router.get('/', verifyToken, (req, res) => {
  try {
    const favorites = db.prepare(`
      SELECT recipes.*, users.username AS author_name, users.avatar AS author_avatar, favorites.created_at AS favorited_at
      FROM favorites
      JOIN recipes ON favorites.recipe_id = recipes.id
      LEFT JOIN users ON recipes.user_id = users.id
      WHERE favorites.user_id = ?
      ORDER BY favorites.created_at DESC
    `).all(req.user.id);

    const formatted = favorites.map(formatRecipe);

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching favorites.'
    });
  }
});

/**
 * POST /api/favorites/:recipeId
 * Add a recipe to user's favorites
 */
router.post('/:recipeId', verifyToken, (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId, 10);
    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID provided.'
      });
    }

    const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.'
      });
    }

    db.prepare(`
      INSERT OR IGNORE INTO favorites (user_id, recipe_id)
      VALUES (?, ?)
    `).run(req.user.id, recipeId);

    return res.status(200).json({
      success: true,
      message: 'Added to favorites'
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while adding to favorites.'
    });
  }
});

/**
 * DELETE /api/favorites/:recipeId
 * Remove a recipe from user's favorites
 */
router.delete('/:recipeId', verifyToken, (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId, 10);
    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID provided.'
      });
    }

    db.prepare(`
      DELETE FROM favorites
      WHERE user_id = ? AND recipe_id = ?
    `).run(req.user.id, recipeId);

    return res.status(200).json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while removing from favorites.'
    });
  }
});

/**
 * GET /api/favorites/check/:recipeId
 * Check if a recipe is in user's favorites
 */
router.get('/check/:recipeId', verifyToken, (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId, 10);
    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID provided.'
      });
    }

    const existing = db.prepare(`
      SELECT id FROM favorites
      WHERE user_id = ? AND recipe_id = ?
      LIMIT 1
    `).get(req.user.id, recipeId);

    return res.status(200).json({
      success: true,
      isFavorited: Boolean(existing)
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while checking favorite status.'
    });
  }
});

module.exports = router;
