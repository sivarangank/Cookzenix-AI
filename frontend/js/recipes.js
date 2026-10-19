// ============================================================
// recipes.js - CookZenix AI Recipe Browsing Logic
// ============================================================

let allRecipes = [];
let filteredRecipes = [];
let currentPage = 1;
const RECIPES_PER_PAGE = 9;
let activeCategory = 'All';
let activeSort = 'newest';
let activeCuisine = 'All';
let activeDifficulty = 'All';
let searchQuery = '';
let debounceTimer;

document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedRecipes();
  loadAllRecipes();
  initFilters();
  initSearch();
  initSortDropdown();
});

// ── Featured Recipes (Home Page) ──────────────────────────────
async function loadFeaturedRecipes() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  createSkeletonCards(6, grid);
  try {
    const data = await API.get('/recipes?sort=rating&limit=6');
    const recipes = data.data || [];
    grid.innerHTML = '';
    if (!recipes.length) {
      grid.innerHTML = '<p class="empty-state">No recipes yet. Be the first to add one!</p>';
      return;
    }
    const favorites = await loadUserFavorites();
    recipes.forEach(recipe => {
      recipe.isFavorited = favorites.includes(recipe.id);
      grid.appendChild(createRecipeCard(recipe));
    });
  } catch (err) {
    grid.innerHTML = '<p class="empty-state">Could not load recipes. Make sure the backend is running.</p>';
    console.error(err);
  }
}

// ── All Recipes (Recipes Page) ────────────────────────────────
async function loadAllRecipes() {
  const grid = document.getElementById('recipes-grid');
  if (!grid) return;

  createSkeletonCards(9, grid);

  // Check URL params for category and cuisine
  const urlCategory = URLParams.get('category');
  if (urlCategory) {
    activeCategory = urlCategory;
    document.querySelectorAll('.category-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.category?.toLowerCase() === urlCategory.toLowerCase());
    });
  }

  const urlCuisine = URLParams.get('cuisine');
  if (urlCuisine) {
    activeCuisine = urlCuisine;
    document.querySelectorAll('.cuisine-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.cuisine?.toLowerCase() === urlCuisine.toLowerCase());
    });
    const cuisineSelect = document.getElementById('cuisine-filter');
    if (cuisineSelect) cuisineSelect.value = urlCuisine;
  }

  try {
    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);
    if (activeCuisine && activeCuisine !== 'All') params.set('cuisine', activeCuisine);
    if (activeDifficulty && activeDifficulty !== 'All') params.set('difficulty', activeDifficulty);
    if (searchQuery) params.set('search', searchQuery);
    params.set('sort', activeSort);

    const data = await API.get(`/recipes?${params}`);
    allRecipes = data.data || [];
    filteredRecipes = [...allRecipes];
    const favorites = await loadUserFavorites();
    allRecipes.forEach(r => r.isFavorited = favorites.includes(r.id));
    filteredRecipes.forEach(r => r.isFavorited = favorites.includes(r.id));
    currentPage = 1;
    renderRecipesGrid(grid);
    updateResultsCount();
    renderPagination();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state-full">
      <span style="font-size:3rem">🍽️</span>
      <h3>Couldn't load recipes</h3>
      <p>Make sure the backend server is running on port 5000</p>
      <a href="http://localhost:5000" target="_blank" class="btn btn-primary btn-sm">Check Server</a>
    </div>`;
    console.error(err);
  }
}

async function loadUserFavorites() {
  if (!Auth.isLoggedIn()) return [];
  try {
    const data = await API.get('/favorites');
    return (data.data || []).map(f => f.id);
  } catch { return []; }
}

// ── Render Grid ───────────────────────────────────────────────
function renderRecipesGrid(grid) {
  grid = grid || document.getElementById('recipes-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const start = (currentPage - 1) * RECIPES_PER_PAGE;
  const pageRecipes = filteredRecipes.slice(start, start + RECIPES_PER_PAGE);

  if (!pageRecipes.length) {
    grid.innerHTML = `<div class="empty-state-full">
      <span style="font-size:3rem">🔍</span>
      <h3>No recipes found</h3>
      <p>Try adjusting your filters or search terms</p>
    </div>`;
    return;
  }

  pageRecipes.forEach((recipe, i) => {
    const card = createRecipeCard(recipe);
    card.style.animationDelay = `${i * 0.08}s`;
    card.classList.add('card-animate');
    grid.appendChild(card);
  });
}

// ── Filters ───────────────────────────────────────────────────
function initFilters() {
  // Category Chips
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.category || 'All';
      currentPage = 1;
      applyFilters();
    });
  });

  // Cuisine Chips
  document.querySelectorAll('.cuisine-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cuisine-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCuisine = chip.dataset.cuisine || 'All';
      const cuisineSelect = document.getElementById('cuisine-filter');
      if (cuisineSelect) cuisineSelect.value = activeCuisine;
      currentPage = 1;
      applyFilters();
    });
  });

  // Cuisine Dropdown Select
  document.getElementById('cuisine-filter')?.addEventListener('change', e => {
    activeCuisine = e.target.value;
    document.querySelectorAll('.cuisine-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.cuisine?.toLowerCase() === activeCuisine.toLowerCase());
    });
    currentPage = 1;
    applyFilters();
  });

  // Difficulty Dropdown Select
  document.getElementById('difficulty-filter')?.addEventListener('change', e => {
    activeDifficulty = e.target.value;
    currentPage = 1;
    applyFilters();
  });
}

function initSortDropdown() {
  document.getElementById('sort-select')?.addEventListener('change', e => {
    activeSort = e.target.value;
    currentPage = 1;
    applyFilters();
  });
}

function initSearch() {
  const searchInput = document.getElementById('recipe-search');
  if (!searchInput) return;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      currentPage = 1;
      applyFilters();
    }, 400);
  });
}

function applyFilters() {
  filteredRecipes = allRecipes.filter(r => {
    // Category Match
    const matchCategory = activeCategory === 'All' ||
      (r.category && r.category.toLowerCase() === activeCategory.toLowerCase());

    // Cuisine Match (Special: 'Indian' matches both Indian and South Indian)
    let matchCuisine = true;
    if (activeCuisine !== 'All') {
      const activeCuisineLower = activeCuisine.toLowerCase();
      const recipeCuisineLower = (r.cuisine || '').toLowerCase();
      if (activeCuisineLower === 'indian') {
        matchCuisine = recipeCuisineLower === 'indian' || recipeCuisineLower === 'south indian';
      } else {
        matchCuisine = recipeCuisineLower === activeCuisineLower;
      }
    }

    // Difficulty Match
    const matchDifficulty = activeDifficulty === 'All' ||
      (r.difficulty && r.difficulty.toLowerCase() === activeDifficulty.toLowerCase());

    // Search Query Match across title, description, cuisine, category, ingredients, and tags
    let matchSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (r.title || '').toLowerCase().includes(q);
      const descMatch = (r.description || '').toLowerCase().includes(q);
      const cuisineMatch = (r.cuisine || '').toLowerCase().includes(q);
      const categoryMatch = (r.category || '').toLowerCase().includes(q);
      const ingText = Array.isArray(r.ingredients) ? r.ingredients.join(' ') : (r.ingredients || '');
      const ingMatch = ingText.toLowerCase().includes(q);
      const tagsText = Array.isArray(r.tags) ? r.tags.join(' ') : (r.tags || '');
      const tagsMatch = tagsText.toLowerCase().includes(q);
      matchSearch = titleMatch || descMatch || cuisineMatch || categoryMatch || ingMatch || tagsMatch;
    }

    return matchCategory && matchCuisine && matchDifficulty && matchSearch;
  });

  // Sort
  if (activeSort === 'rating') {
    filteredRecipes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (activeSort === 'popular') {
    filteredRecipes.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0));
  } else {
    filteredRecipes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  renderRecipesGrid();
  updateResultsCount();
  renderPagination();
}

function updateResultsCount() {
  const el = document.getElementById('results-count');
  if (el) el.textContent = `${filteredRecipes.length} recipe${filteredRecipes.length !== 1 ? 's' : ''} found`;
}

// ── Pagination ────────────────────────────────────────────────
function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;
  const totalPages = Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">&#8249;</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage || i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="page-ellipsis">...</span>`;
    }
  }
  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">&#8250;</button>`;
  container.innerHTML = html;

  container.querySelectorAll('.page-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderRecipesGrid();
      renderPagination();
    });
  });
}
