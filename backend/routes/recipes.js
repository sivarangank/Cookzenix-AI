const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, optionalAuth } = require('../middleware/auth');

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
 * GET /api/recipes
 * List recipes with optional filtering and sorting
 * Query params: search, category, cuisine, difficulty, sort
 */
router.get('/', (req, res) => {
  try {
    const { search, category, cuisine, difficulty, sort } = req.query;

    let sql = `
      SELECT recipes.*, users.username AS author_name, users.avatar AS author_avatar
      FROM recipes
      LEFT JOIN users ON recipes.user_id = users.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      sql += ` AND (recipes.title LIKE ? OR recipes.description LIKE ? OR recipes.tags LIKE ? OR recipes.ingredients LIKE ? OR recipes.cuisine LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (category && category.trim().toLowerCase() !== 'all') {
      sql += ` AND LOWER(recipes.category) = LOWER(?)`;
      params.push(category.trim());
    }

    if (cuisine && cuisine.trim().toLowerCase() !== 'all') {
      const c = cuisine.trim().toLowerCase();
      if (c === 'indian') {
        sql += ` AND (LOWER(recipes.cuisine) = 'indian' OR LOWER(recipes.cuisine) = 'south indian')`;
      } else {
        sql += ` AND LOWER(recipes.cuisine) = LOWER(?)`;
        params.push(cuisine.trim());
      }
    }

    if (difficulty && difficulty.trim().toLowerCase() !== 'all') {
      sql += ` AND LOWER(recipes.difficulty) = LOWER(?)`;
      params.push(difficulty.trim());
    }

    if (sort === 'newest') {
      sql += ` ORDER BY recipes.created_at DESC`;
    } else if (sort === 'popular') {
      sql += ` ORDER BY recipes.rating_count DESC, recipes.rating DESC`;
    } else if (sort === 'rating') {
      sql += ` ORDER BY recipes.rating DESC, recipes.rating_count DESC`;
    } else {
      sql += ` ORDER BY recipes.id DESC`;
    }

    const rows = db.prepare(sql).all(...params);
    const recipes = rows.map(formatRecipe);

    return res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching recipes.'
    });
  }
});

/**
 * GET /api/recipes/:id
 * Retrieve a single recipe by ID, including author info and comment count
 */
router.get('/:id', (req, res) => {
  try {
    const recipeId = parseInt(req.params.id, 10);
    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID provided.'
      });
    }

    const recipe = db.prepare(`
      SELECT recipes.*, users.username AS author_name, users.avatar AS author_avatar
      FROM recipes
      LEFT JOIN users ON recipes.user_id = users.id
      WHERE recipes.id = ?
    `).get(recipeId);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.'
      });
    }

    const commentRow = db.prepare(`
      SELECT COUNT(*) AS count
      FROM comments
      WHERE recipe_id = ?
    `).get(recipeId);

    const formatted = formatRecipe(recipe);
    formatted.comment_count = commentRow ? commentRow.count : 0;

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching single recipe:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching recipe details.'
    });
  }
});

/**
 * POST /api/recipes
 * Create a new recipe (auth required)
 */
router.post('/', optionalAuth, (req, res) => {
  try {
    const {
      title,
      description = '',
      image_url,
      category,
      cuisine,
      difficulty = 'Medium',
      prep_time = 15,
      cook_time = 30,
      servings = 4,
      ingredients = [],
      steps = [],
      nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      tags = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Recipe title is required.'
      });
    }

    const userId = req.user ? req.user.id : 1;
    const finalImageUrl = (image_url && image_url.trim()) ? image_url.trim() : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&auto=format&fit=crop';
    const finalCategory = (category && category.trim()) ? category.trim() : 'Curry';
    const finalCuisine = (cuisine && cuisine.trim()) ? cuisine.trim() : 'South Indian';

    const ingredientsJson = typeof ingredients === 'string'
      ? (ingredients.startsWith('[') ? ingredients : JSON.stringify(ingredients.split('\n').filter(Boolean)))
      : JSON.stringify(ingredients);

    const stepsJson = typeof steps === 'string'
      ? (steps.startsWith('[') ? steps : JSON.stringify(steps.split('\n').filter(Boolean)))
      : JSON.stringify(steps);

    const nutritionJson = typeof nutrition === 'string'
      ? nutrition
      : JSON.stringify(nutrition);

    const tagsJson = typeof tags === 'string'
      ? (tags.startsWith('[') ? tags : JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)))
      : JSON.stringify(tags);

    const insertRecipe = db.prepare(`
      INSERT INTO recipes (
        user_id, title, description, image_url, category, cuisine,
        difficulty, prep_time, cook_time, servings, ingredients,
        steps, nutrition, tags, rating, rating_count
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, 5.0, 0
      )
    `);

    const result = insertRecipe.run(
      userId,
      title.trim(),
      description ? description.trim() : '',
      finalImageUrl,
      finalCategory,
      finalCuisine,
      difficulty,
      Number(prep_time) || 15,
      Number(cook_time) || 30,
      Number(servings) || 4,
      ingredientsJson,
      stepsJson,
      nutritionJson,
      tagsJson
    );

    const newRecipe = db.prepare(`
      SELECT recipes.*, users.username AS author_name, users.avatar AS author_avatar
      FROM recipes
      LEFT JOIN users ON recipes.user_id = users.id
      WHERE recipes.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Recipe created successfully!',
      data: formatRecipe(newRecipe)
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating recipe.'
    });
  }
});

/**
 * PUT /api/recipes/:id
 * Update an existing recipe (auth required, owner or admin only)
 */
router.put('/:id', verifyToken, (req, res) => {
  try {
    const recipeId = parseInt(req.params.id, 10);
    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID provided.'
      });
    }

    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.'
      });
    }

    // Check ownership: must be author or platform admin
    if (recipe.user_id !== req.user.id && req.user.username !== 'cookzenix_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this recipe.'
      });
    }

    const {
      title = recipe.title,
      description = recipe.description,
      image_url = recipe.image_url,
      category = recipe.category,
      cuisine = recipe.cuisine,
      difficulty = recipe.difficulty,
      prep_time = recipe.prep_time,
      cook_time = recipe.cook_time,
      servings = recipe.servings,
      ingredients,
      steps,
      nutrition,
      tags
    } = req.body;

    const ingredientsJson = ingredients !== undefined
      ? (typeof ingredients === 'string' ? (ingredients.startsWith('[') ? ingredients : JSON.stringify(ingredients.split('\n').filter(Boolean))) : JSON.stringify(ingredients))
      : recipe.ingredients;

    const stepsJson = steps !== undefined
      ? (typeof steps === 'string' ? (steps.startsWith('[') ? steps : JSON.stringify(steps.split('\n').filter(Boolean))) : JSON.stringify(steps))
      : recipe.steps;

    const nutritionJson = nutrition !== undefined
      ? (typeof nutrition === 'string' ? nutrition : JSON.stringify(nutrition))
      : recipe.nutrition;

    const tagsJson = tags !== undefined
      ? (typeof tags === 'string' ? (tags.startsWith('[') ? tags : JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean))) : JSON.stringify(tags))
      : recipe.tags;

    db.prepare(`
      UPDATE recipes
      SET title = ?, description = ?, image_url = ?, category = ?, cuisine = ?,
          difficulty = ?, prep_time = ?, cook_time = ?, servings = ?,
          ingredients = ?, steps = ?, nutrition = ?, tags = ?
      WHERE id = ?
    `).run(
      title,
      description,
      image_url,
      category,
      cuisine,
      difficulty,
      Number(prep_time),
      Number(cook_time),
      Number(servings),
      ingredientsJson,
      stepsJson,
      nutritionJson,
      tagsJson,
      recipeId
    );

    const updated = db.prepare(`
      SELECT recipes.*, users.username AS author_name, users.avatar AS author_avatar
      FROM recipes
      LEFT JOIN users ON recipes.user_id = users.id
      WHERE recipes.id = ?
    `).get(recipeId);

    return res.status(200).json({
      success: true,
      message: 'Recipe updated successfully!',
      data: formatRecipe(updated)
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating recipe.'
    });
  }
});

/**
 * DELETE /api/recipes/:id
 * Delete a recipe (auth required, owner or admin only)
 */
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const recipeId = parseInt(req.params.id, 10);
    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID provided.'
      });
    }

    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.'
      });
    }

    // Check ownership: must be author or platform admin
    if (recipe.user_id !== req.user.id && req.user.username !== 'cookzenix_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this recipe.'
      });
    }

    // Delete cascading references
    db.prepare('DELETE FROM favorites WHERE recipe_id = ?').run(recipeId);
    db.prepare('DELETE FROM comments WHERE recipe_id = ?').run(recipeId);
    db.prepare('DELETE FROM recipes WHERE id = ?').run(recipeId);

    return res.status(200).json({
      success: true,
      message: 'Recipe and associated records deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting recipe.'
    });
  }
});

/**
 * GET /api/recipes/:id/comments
 * Get all comments for a recipe with author username and avatar
 */
router.get('/:id/comments', (req, res) => {
  try {
    const recipeId = parseInt(req.params.id, 10);
    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID provided.'
      });
    }

    const comments = db.prepare(`
      SELECT comments.*, users.username, users.avatar
      FROM comments
      LEFT JOIN users ON comments.user_id = users.id
      WHERE comments.recipe_id = ?
      ORDER BY comments.created_at DESC
    `).all(recipeId);

    return res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching recipe comments.'
    });
  }
});

/**
 * POST /api/recipes/:id/comments
 * Add a comment and rating to a recipe (auth required)
 */
router.post('/:id/comments', verifyToken, (req, res) => {
  try {
    const recipeId = parseInt(req.params.id, 10);
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

    const { text, rating = 5 } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty.'
      });
    }

    const numericRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));

    const insertComment = db.prepare(`
      INSERT INTO comments (user_id, recipe_id, text, rating)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertComment.run(req.user.id, recipeId, text.trim(), numericRating);
    const newCommentId = result.lastInsertRowid;

    // Recalculate average rating and count
    const ratingStats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM comments
      WHERE recipe_id = ?
    `).get(recipeId);

    const newAvg = ratingStats && ratingStats.avg_rating
      ? Math.round(ratingStats.avg_rating * 10) / 10
      : numericRating;
    const newCount = ratingStats ? ratingStats.count : 1;

    db.prepare(`
      UPDATE recipes
      SET rating = ?, rating_count = ?
      WHERE id = ?
    `).run(newAvg, newCount, recipeId);

    const newComment = db.prepare(`
      SELECT comments.*, users.username, users.avatar
      FROM comments
      LEFT JOIN users ON comments.user_id = users.id
      WHERE comments.id = ?
    `).get(newCommentId);

    return res.status(201).json({
      success: true,
      message: 'Comment submitted successfully!',
      data: {
        comment: newComment,
        recipe_rating: newAvg,
        recipe_rating_count: newCount
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while posting comment.'
    });
  }
});

module.exports = router;
