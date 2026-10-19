// ============================================================
// add-recipe.js - CookZenix AI Add / Edit Recipe
// ============================================================

let currentStep = 1;
const TOTAL_STEPS = 3;
let editRecipeId = null;

document.addEventListener('DOMContentLoaded', () => {
  editRecipeId = URLParams.get('edit');
  if (editRecipeId && !Auth.isLoggedIn()) {
    Toast.warning('Please sign in to edit your recipe');
    setTimeout(() => window.location.href = `signin.html?redirect=add-recipe.html?edit=${editRecipeId}`, 1200);
    return;
  }
  initStepNavigation();
  initImagePreview();
  initIngredientManager();
  initStepManager();
  if (editRecipeId) loadRecipeForEdit(editRecipeId);
});

// ── Step Navigation ───────────────────────────────────────────
function initStepNavigation() {
  showStep(1);

  document.getElementById('next-step-1')?.addEventListener('click', () => {
    if (validateStep1()) showStep(2);
  });
  document.getElementById('next-step-2')?.addEventListener('click', () => {
    if (validateStep2()) showStep(3);
  });
  document.getElementById('prev-step-2')?.addEventListener('click', () => showStep(1));
  document.getElementById('prev-step-3')?.addEventListener('click', () => showStep(2));

  document.getElementById('submit-recipe')?.addEventListener('click', handleSubmit);
}

function showStep(step) {
  currentStep = step;
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const panel = document.getElementById(`step-${i}`);
    const indicator = document.getElementById(`step-indicator-${i}`);
    if (panel) panel.classList.toggle('active', i === step);
    if (indicator) {
      indicator.classList.toggle('active', i === step);
      indicator.classList.toggle('completed', i < step);
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Validation ────────────────────────────────────────────────
function validateStep1() {
  const title = document.getElementById('recipe-title')?.value.trim();
  const desc = document.getElementById('recipe-description')?.value.trim();
  const cat = document.getElementById('recipe-category')?.value;
  if (!title) { Toast.error('Please enter a recipe title'); return false; }
  if (title.length < 3) { Toast.error('Title must be at least 3 characters'); return false; }
  if (!desc) { Toast.error('Please add a description'); return false; }
  if (!cat) { Toast.error('Please select a category'); return false; }
  return true;
}

function validateStep2() {
  const ingredients = getIngredients();
  const steps = getSteps();
  if (ingredients.length < 2) { Toast.error('Please add at least 2 ingredients'); return false; }
  if (steps.length < 1) { Toast.error('Please add at least 1 step'); return false; }
  return true;
}

// ── Image Preview ─────────────────────────────────────────────
function initImagePreview() {
  document.getElementById('recipe-image')?.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    const preview = document.getElementById('image-preview');
    const img = document.getElementById('preview-img');
    if (!preview || !img) return;
    if (url) {
      img.src = url;
      img.onload = () => preview.style.display = 'block';
      img.onerror = () => { preview.style.display = 'none'; };
    } else {
      preview.style.display = 'none';
    }
  });
}

// ── Ingredient Manager ────────────────────────────────────────
function initIngredientManager() {
  const container = document.getElementById('ingredients-container');
  if (!container) return;
  addIngredientRow(container);

  document.getElementById('add-ingredient')?.addEventListener('click', () => {
    addIngredientRow(container);
  });
}

function addIngredientRow(container, value = '') {
  const row = document.createElement('div');
  row.className = 'dynamic-row ingredient-row';
  row.innerHTML = `
    <input type="text" class="form-input ingredient-input" placeholder="e.g. 2 cups all-purpose flour" value="${value}">
    <button type="button" class="btn-remove" title="Remove">✕</button>
  `;
  row.querySelector('.btn-remove').addEventListener('click', () => {
    const rows = container.querySelectorAll('.ingredient-row');
    if (rows.length > 1) row.remove();
    else Toast.warning('Need at least one ingredient');
  });
  container.appendChild(row);
  row.querySelector('input')?.focus();
}

function getIngredients() {
  return Array.from(document.querySelectorAll('.ingredient-input'))
    .map(i => i.value.trim())
    .filter(Boolean);
}

// ── Steps Manager ─────────────────────────────────────────────
function initStepManager() {
  const container = document.getElementById('steps-container');
  if (!container) return;
  addStepRow(container);

  document.getElementById('add-step')?.addEventListener('click', () => {
    addStepRow(container);
    updateStepNumbers();
  });
}

function addStepRow(container, value = '') {
  const stepNum = container.querySelectorAll('.step-row').length + 1;
  const row = document.createElement('div');
  row.className = 'dynamic-row step-row';
  row.innerHTML = `
    <div class="step-num-badge">${stepNum}</div>
    <textarea class="form-input form-textarea step-input" rows="2" placeholder="Describe this step...">${value}</textarea>
    <button type="button" class="btn-remove" title="Remove">✕</button>
  `;
  row.querySelector('.btn-remove').addEventListener('click', () => {
    const rows = container.querySelectorAll('.step-row');
    if (rows.length > 1) { row.remove(); updateStepNumbers(); }
    else Toast.warning('Need at least one step');
  });
  container.appendChild(row);
}

function updateStepNumbers() {
  document.querySelectorAll('.step-num-badge').forEach((el, i) => { el.textContent = i + 1; });
}

function getSteps() {
  return Array.from(document.querySelectorAll('.step-input'))
    .map(t => t.value.trim())
    .filter(Boolean);
}

// ── Submit ────────────────────────────────────────────────────
async function handleSubmit() {
  const btn = document.getElementById('submit-recipe');
  const title = document.getElementById('recipe-title')?.value.trim();
  const description = document.getElementById('recipe-description')?.value.trim();
  const image_url = document.getElementById('recipe-image')?.value.trim();
  const category = document.getElementById('recipe-category')?.value;
  const cuisine = document.getElementById('recipe-cuisine')?.value;
  const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'Medium';
  const prep_time = parseInt(document.getElementById('prep-time')?.value) || 15;
  const cook_time = parseInt(document.getElementById('cook-time')?.value) || 30;
  const servings = parseInt(document.getElementById('servings')?.value) || 4;
  const tagsRaw = document.getElementById('recipe-tags')?.value || '';
  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
  const ingredients = getIngredients();
  const steps = getSteps();
  const nutrition = {
    calories: parseInt(document.getElementById('nutrition-calories')?.value) || null,
    protein: parseInt(document.getElementById('nutrition-protein')?.value) || null,
    carbs: parseInt(document.getElementById('nutrition-carbs')?.value) || null,
    fat: parseInt(document.getElementById('nutrition-fat')?.value) || null,
    fiber: parseInt(document.getElementById('nutrition-fiber')?.value) || null,
  };

  if (!title) {
    Toast.error('Please enter a recipe title');
    showStep(1);
    document.getElementById('recipe-title')?.focus();
    return;
  }

  if (ingredients.length < 1) {
    Toast.error('Please add at least 1 ingredient');
    showStep(2);
    return;
  }

  if (steps.length < 1) {
    Toast.error('Please add at least 1 instruction step');
    showStep(2);
    return;
  }

  const payload = {
    title,
    description: description || 'Delicious homemade recipe',
    image_url: image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&auto=format&fit=crop',
    category: category || 'Curry',
    cuisine: cuisine || 'South Indian',
    difficulty,
    prep_time,
    cook_time,
    servings,
    ingredients,
    steps,
    nutrition,
    tags: tags.length ? tags : ['homemade', (category || 'curry').toLowerCase()]
  };

  setButtonLoading(btn, true, editRecipeId ? 'Updating...' : 'Publishing...');

  try {
    let data;
    if (editRecipeId) {
      data = await API.put(`/recipes/${editRecipeId}`, payload);
      Toast.success('Recipe updated! 🎉');
      setTimeout(() => window.location.href = `recipe-detail.html?id=${editRecipeId}`, 1000);
    } else {
      data = await API.post('/recipes', payload);
      const newId = (data && data.data && data.data.id) ? data.data.id : (data && data.id);
      Toast.success('Recipe published successfully! 🍽️');
      setTimeout(() => {
        if (newId) {
          window.location.href = `recipe-detail.html?id=${newId}`;
        } else {
          window.location.href = 'recipes.html';
        }
      }, 1000);
    }
  } catch (err) {
    console.error('Submit recipe error:', err);
    Toast.error(err.message || 'Failed to save recipe');
    setButtonLoading(btn, false, editRecipeId ? 'Update Recipe' : 'Publish Recipe');
  }
}

// ── Load Recipe for Editing ───────────────────────────────────
async function loadRecipeForEdit(id) {
  try {
    const data = await API.get(`/recipes/${id}`);
    const r = data.data;
    if (!r) return;

    // Verify ownership
    const user = Auth.getUser();
    if (r.user_id !== user.id) {
      Toast.error("You can't edit this recipe");
      window.location.href = 'recipes.html';
      return;
    }

    document.title = 'Edit Recipe - CookZenix AI';
    const heading = document.querySelector('.add-recipe-heading');
    if (heading) heading.textContent = 'Edit Recipe';
    const submitBtn = document.getElementById('submit-recipe');
    if (submitBtn) submitBtn.textContent = 'Update Recipe';

    // Fill step 1
    if (document.getElementById('recipe-title')) document.getElementById('recipe-title').value = r.title;
    if (document.getElementById('recipe-description')) document.getElementById('recipe-description').value = r.description || '';
    if (document.getElementById('recipe-image')) {
      document.getElementById('recipe-image').value = r.image_url || '';
      document.getElementById('recipe-image').dispatchEvent(new Event('input'));
    }
    if (document.getElementById('recipe-category')) document.getElementById('recipe-category').value = r.category || '';
    if (document.getElementById('recipe-cuisine')) document.getElementById('recipe-cuisine').value = r.cuisine || '';

    // Fill ingredients
    const ingContainer = document.getElementById('ingredients-container');
    if (ingContainer) {
      ingContainer.innerHTML = '';
      let ings = [];
      try { ings = JSON.parse(r.ingredients || '[]'); } catch {}
      ings.forEach(ing => addIngredientRow(ingContainer, ing));
      if (!ings.length) addIngredientRow(ingContainer);
    }

    // Fill steps
    const stepsContainer = document.getElementById('steps-container');
    if (stepsContainer) {
      stepsContainer.innerHTML = '';
      let stps = [];
      try { stps = JSON.parse(r.steps || '[]'); } catch {}
      stps.forEach(st => addStepRow(stepsContainer, st));
      if (!stps.length) addStepRow(stepsContainer);
    }

    // Fill details
    if (document.getElementById('prep-time')) document.getElementById('prep-time').value = r.prep_time || 15;
    if (document.getElementById('cook-time')) document.getElementById('cook-time').value = r.cook_time || 30;
    if (document.getElementById('servings')) document.getElementById('servings').value = r.servings || 4;
    const diffRadio = document.querySelector(`input[name="difficulty"][value="${r.difficulty || 'Medium'}"]`);
    if (diffRadio) diffRadio.checked = true;
    let tags = [];
    try { tags = JSON.parse(r.tags || '[]'); } catch {}
    if (document.getElementById('recipe-tags')) document.getElementById('recipe-tags').value = tags.join(', ');
    let nutrition = {};
    try { nutrition = JSON.parse(r.nutrition || '{}'); } catch {}
    if (nutrition.calories) document.getElementById('nutrition-calories').value = nutrition.calories;
    if (nutrition.protein) document.getElementById('nutrition-protein').value = nutrition.protein;
    if (nutrition.carbs) document.getElementById('nutrition-carbs').value = nutrition.carbs;
    if (nutrition.fat) document.getElementById('nutrition-fat').value = nutrition.fat;
    if (nutrition.fiber) document.getElementById('nutrition-fiber').value = nutrition.fiber;

  } catch (err) {
    Toast.error('Failed to load recipe for editing');
    console.error(err);
  }
}
