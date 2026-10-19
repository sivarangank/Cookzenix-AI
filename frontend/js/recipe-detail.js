// ============================================================
// recipe-detail.js - CookZenix AI Recipe Detail Page
// ============================================================

let currentRecipe = null;
let activeTab = 'ingredients';

document.addEventListener('DOMContentLoaded', () => {
  const id = URLParams.get('id');
  if (!id) {
    Toast.error('No recipe selected');
    setTimeout(() => window.location.href = 'recipes.html', 1500);
    return;
  }
  loadRecipeDetail(id);
  initTabs();
});

// ── Load Recipe ───────────────────────────────────────────────
async function loadRecipeDetail(id) {
  try {
    showDetailLoading();
    const data = await API.get(`/recipes/${id}`);
    currentRecipe = data.data;
    renderRecipeHero(currentRecipe);
    renderRecipeMeta(currentRecipe);
    renderIngredients(currentRecipe.ingredients);
    renderSteps(currentRecipe.steps);
    renderNutrition(currentRecipe.nutrition);
    renderTags(currentRecipe.tags);
    renderAuthor(currentRecipe);
    await loadComments(id);
    await checkFavoriteStatus(id);
    document.title = `${currentRecipe.title} - CookZenix AI`;
    initFavoriteBtn(id);
    initShareBtn();
    initOwnerActions(id);
  } catch (err) {
    document.body.innerHTML = `<div class="error-page">
      <h2>Recipe not found 😢</h2>
      <p>${err.message}</p>
      <a href="recipes.html" class="btn btn-primary">Back to Recipes</a>
    </div>`;
  }
}

function showDetailLoading() {
  const hero = document.getElementById('recipe-hero');
  if (hero) hero.innerHTML = '<div class="skeleton" style="height:100%;border-radius:0"></div>';
}

// ── Hero ──────────────────────────────────────────────────────
function renderRecipeHero(recipe) {
  const hero = document.getElementById('recipe-hero');
  if (!hero) return;
  hero.style.backgroundImage = `url('${recipe.image_url || ''}')`;
  hero.style.backgroundSize = 'cover';
  hero.style.backgroundPosition = 'center';
  hero.innerHTML = `
    <div class="recipe-hero-overlay"></div>
    <div class="recipe-hero-content">
      <div class="recipe-hero-badges">
        <span class="badge badge-category">${recipe.category || ''}</span>
        <span class="badge badge-cuisine">${recipe.cuisine || ''}</span>
        <span class="badge badge-difficulty-${(recipe.difficulty||'Medium').toLowerCase()}">${recipe.difficulty || 'Medium'}</span>
      </div>
      <h1 class="recipe-hero-title">${recipe.title}</h1>
      <p class="recipe-hero-desc">${recipe.description || ''}</p>
      <div class="recipe-hero-rating">
        ${renderStars(recipe.rating || 4.5)}
        <span class="rating-text">${(recipe.rating || 4.5).toFixed(1)} · ${recipe.rating_count || 0} reviews</span>
      </div>
    </div>
  `;
}

// ── Meta Strip ────────────────────────────────────────────────
function renderRecipeMeta(recipe) {
  const meta = document.getElementById('recipe-meta');
  if (!meta) return;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  meta.innerHTML = `
    <div class="meta-card"><span class="meta-icon">⏱️</span><span class="meta-label">Prep</span><span class="meta-val">${recipe.prep_time || 0} min</span></div>
    <div class="meta-card"><span class="meta-icon">🔥</span><span class="meta-label">Cook</span><span class="meta-val">${recipe.cook_time || 0} min</span></div>
    <div class="meta-card"><span class="meta-icon">⏳</span><span class="meta-label">Total</span><span class="meta-val">${totalTime} min</span></div>
    <div class="meta-card"><span class="meta-icon">👥</span><span class="meta-label">Serves</span><span class="meta-val">${recipe.servings || 4}</span></div>
    <div class="meta-card"><span class="meta-icon">📊</span><span class="meta-label">Difficulty</span><span class="meta-val">${recipe.difficulty || 'Medium'}</span></div>
    <div class="meta-card"><span class="meta-icon">🌍</span><span class="meta-label">Cuisine</span><span class="meta-val">${recipe.cuisine || 'Global'}</span></div>
  `;
}

function safeParse(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
}

// ── Ingredients ───────────────────────────────────────────────
function renderIngredients(ingredientsRaw) {
  const list = document.getElementById('ingredients-list');
  if (!list) return;
  const ingredients = safeParse(ingredientsRaw, []);
  if (!Array.isArray(ingredients) || !ingredients.length) {
    list.innerHTML = '<li>No ingredients listed</li>';
    return;
  }
  list.innerHTML = ingredients.map((ing, i) => `
    <li class="ingredient-item" id="ing-${i}">
      <label class="ingredient-label">
        <input type="checkbox" class="ingredient-check" id="check-${i}">
        <span class="check-custom"></span>
        <span class="ingredient-text">${ing}</span>
      </label>
    </li>
  `).join('');

  list.querySelectorAll('.ingredient-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const text = cb.closest('.ingredient-label').querySelector('.ingredient-text');
      text.style.textDecoration = cb.checked ? 'line-through' : 'none';
      text.style.opacity = cb.checked ? '0.5' : '1';
    });
  });
}

// ── Steps ─────────────────────────────────────────────────────
function renderSteps(stepsRaw) {
  const list = document.getElementById('steps-list');
  if (!list) return;
  const steps = safeParse(stepsRaw, []);
  if (!Array.isArray(steps) || !steps.length) {
    list.innerHTML = '<li>No instructions listed</li>';
    return;
  }
  list.innerHTML = steps.map((step, i) => `
    <li class="step-item" id="step-${i + 1}">
      <div class="step-number">${i + 1}</div>
      <div class="step-content">
        <p>${step}</p>
      </div>
    </li>
  `).join('');
}

// ── Nutrition ─────────────────────────────────────────────────
function renderNutrition(nutritionRaw) {
  const nutrition = safeParse(nutritionRaw, {});
  const items = [
    { key: 'calories', label: 'Calories', icon: '🔥', unit: 'kcal' },
    { key: 'protein', label: 'Protein', icon: '💪', unit: 'g' },
    { key: 'carbs', label: 'Carbs', icon: '🌾', unit: 'g' },
    { key: 'fat', label: 'Fat', icon: '🥑', unit: 'g' },
    { key: 'fiber', label: 'Fiber', icon: '🥦', unit: 'g' },
  ];

  const grid = document.getElementById('nutrition-grid');
  if (grid) {
    grid.innerHTML = items.map(item => `
      <div class="nutrition-card">
        <span class="nutrition-icon">${item.icon}</span>
        <span class="nutrition-value">${nutrition && nutrition[item.key] != null ? nutrition[item.key] : '—'}</span>
        <span class="nutrition-unit">${nutrition && nutrition[item.key] != null ? item.unit : ''}</span>
        <span class="nutrition-label">${item.label}</span>
      </div>
    `).join('');
  }

  const sidebarList = document.getElementById('sidebar-nutrition-list');
  if (sidebarList) {
    sidebarList.innerHTML = items.map(item => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); font-size: var(--fs-sm);">
        <span style="color: var(--text-secondary); display:flex; align-items:center; gap:6px;">
          <span>${item.icon}</span> ${item.label}
        </span>
        <span style="font-weight: var(--fw-bold); color: var(--text-primary);">
          ${nutrition && nutrition[item.key] != null ? `${nutrition[item.key]} ${item.unit}` : '—'}
        </span>
      </div>
    `).join('');
  }
}

// ── Tags ──────────────────────────────────────────────────────
function renderTags(tagsRaw) {
  const container = document.getElementById('recipe-tags');
  if (!container) return;
  const tags = safeParse(tagsRaw, []);
  if (!Array.isArray(tags)) return;
  container.innerHTML = tags.map(tag => `<span class="tag-badge">#${tag}</span>`).join('');
}

// ── Author ────────────────────────────────────────────────────
function renderAuthor(recipe) {
  const el = document.getElementById('recipe-author');
  if (!el) return;
  el.innerHTML = `
    <div class="author-avatar">${(recipe.username || 'C').charAt(0).toUpperCase()}</div>
    <div class="author-info">
      <span class="author-name">By ${recipe.username || 'CookZenix'}</span>
      <span class="author-date">${new Date(recipe.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
  `;
}

// ── Tabs ──────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
      });
      btn.classList.add('active');
      const target = btn.dataset.tab;
      const targetPanel = document.getElementById(`panel-${target}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
        targetPanel.style.display = 'block';
      }
      activeTab = target;
    });
  });
}

// ── Favorite ──────────────────────────────────────────────────
async function checkFavoriteStatus(recipeId) {
  const btn = document.getElementById('favorite-btn');
  if (!btn || !Auth.isLoggedIn()) return;
  try {
    const data = await API.get(`/favorites/check/${recipeId}`);
    if (data.isFavorited) {
      btn.classList.add('favorited');
      btn.innerHTML = '❤️ Saved';
    }
  } catch {}
}

function initFavoriteBtn(recipeId) {
  const btn = document.getElementById('favorite-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (!Auth.isLoggedIn()) {
      Toast.warning('Please sign in to save favorites!');
      return;
    }
    try {
      if (btn.classList.contains('favorited')) {
        await API.delete(`/favorites/${recipeId}`);
        btn.classList.remove('favorited');
        btn.innerHTML = '🤍 Save Recipe';
        Toast.info('Removed from favorites');
      } else {
        await API.post(`/favorites/${recipeId}`, {});
        btn.classList.add('favorited');
        btn.innerHTML = '❤️ Saved';
        Toast.success('Saved to favorites! ❤️');
      }
    } catch (err) { Toast.error(err.message); }
  });
}

// ── Share ─────────────────────────────────────────────────────
function initShareBtn() {
  document.getElementById('share-btn')?.addEventListener('click', async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: currentRecipe?.title || 'CookZenix Recipe', url });
    } else {
      await navigator.clipboard.writeText(url);
      Toast.success('Link copied to clipboard!');
    }
  });
}

// ── Owner Actions (Edit/Delete) ───────────────────────────────
function initOwnerActions(recipeId) {
  const user = Auth.getUser();
  if (!user || !currentRecipe || currentRecipe.user_id !== user.id) return;
  const actionsEl = document.getElementById('owner-actions');
  if (!actionsEl) return;
  actionsEl.style.display = 'flex';
  document.getElementById('edit-recipe-btn')?.addEventListener('click', () => {
    window.location.href = `add-recipe.html?edit=${recipeId}`;
  });
  document.getElementById('delete-recipe-btn')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete this recipe? This cannot be undone.')) return;
    try {
      await API.delete(`/recipes/${recipeId}`);
      Toast.success('Recipe deleted!');
      setTimeout(() => window.location.href = 'profile.html', 1000);
    } catch (err) { Toast.error(err.message); }
  });
}

// ── Comments ──────────────────────────────────────────────────
async function loadComments(recipeId) {
  const list = document.getElementById('comments-list');
  if (!list) return;
  try {
    const data = await API.get(`/recipes/${recipeId}/comments`);
    const comments = data.data || [];
    if (!comments.length) {
      list.innerHTML = '<div class="empty-state"><span>💬</span><p>No reviews yet. Be the first to review!</p></div>';
    } else {
      list.innerHTML = comments.map(c => `
        <div class="comment-card">
          <div class="comment-header">
            <div class="comment-avatar">${(c.username || 'U').charAt(0).toUpperCase()}</div>
            <div class="comment-meta">
              <strong>${c.username || 'Anonymous'}</strong>
              <div class="comment-stars">${renderStars(c.rating || 5)}</div>
            </div>
            <span class="comment-date">${new Date(c.created_at).toLocaleDateString()}</span>
          </div>
          <p class="comment-text">${c.text}</p>
        </div>
      `).join('');
    }
    initCommentForm(recipeId);
  } catch {}
}

function initCommentForm(recipeId) {
  const form = document.getElementById('comment-form');
  if (!form) return;
  if (!Auth.isLoggedIn()) {
    form.innerHTML = `<div class="login-prompt">
      <a href="signin.html" class="btn btn-primary btn-sm">Sign in to leave a review</a>
    </div>`;
    return;
  }

  let selectedRating = 5;
  const stars = form.querySelectorAll('.rating-star');
  stars.forEach((star, i) => {
    star.addEventListener('click', () => {
      selectedRating = i + 1;
      stars.forEach((s, j) => s.classList.toggle('selected', j < selectedRating));
    });
    star.addEventListener('mouseenter', () => {
      stars.forEach((s, j) => s.classList.toggle('hovered', j <= i));
    });
  });
  form.addEventListener('mouseleave', () => {
    stars.forEach((s, j) => {
      s.classList.remove('hovered');
      s.classList.toggle('selected', j < selectedRating);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = form.querySelector('#comment-text').value.trim();
    if (!text) { Toast.warning('Please write a review'); return; }
    const btn = form.querySelector('#comment-submit');
    setButtonLoading(btn, true, 'Posting...');
    try {
      await API.post(`/recipes/${recipeId}/comments`, { text, rating: selectedRating });
      Toast.success('Review posted! ⭐');
      await loadComments(recipeId);
      form.querySelector('#comment-text').value = '';
      selectedRating = 5;
      stars.forEach((s, j) => s.classList.toggle('selected', j < 5));
    } catch (err) { Toast.error(err.message); }
    finally { setButtonLoading(btn, false, 'Post Review'); }
  });
}
