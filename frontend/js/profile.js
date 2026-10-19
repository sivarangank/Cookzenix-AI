// ============================================================
// profile.js - CookZenix AI User Profile Page
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLoggedIn()) {
    Toast.warning('Please sign in to view your profile');
    setTimeout(() => window.location.href = 'signin.html', 1200);
    return;
  }
  initProfile();
});

async function initProfile() {
  await loadProfileData();
  initTabSwitcher();
  await loadMyRecipes();
  await loadFavorites();
  initEditProfileModal();
}

// ── Load Profile Data ─────────────────────────────────────────
async function loadProfileData() {
  const user = Auth.getUser();
  if (!user) return;

  const usernameEl = document.getElementById('profile-username');
  const bioEl = document.getElementById('profile-bio');
  const avatarEl = document.getElementById('profile-avatar');

  if (usernameEl) usernameEl.textContent = user.username;
  if (bioEl) bioEl.textContent = user.bio || 'Food enthusiast & recipe explorer 🍽️';
  if (avatarEl) {
    avatarEl.textContent = user.username.charAt(0).toUpperCase();
    avatarEl.style.background = `hsl(${hashString(user.username) % 360}, 65%, 45%)`;
  }

  try {
    const data = await API.get('/auth/profile');
    const fullUser = data.data;
    if (fullUser) {
      Auth.setSession(Auth.getToken(), { ...user, ...fullUser });
      if (bioEl) bioEl.textContent = fullUser.bio || 'Food enthusiast & recipe explorer 🍽️';
    }
  } catch {}

  updateStats();
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

// ── My Recipes ────────────────────────────────────────────────
async function loadMyRecipes() {
  const grid = document.getElementById('my-recipes-grid');
  if (!grid) return;
  createSkeletonCards(3, grid);

  try {
    const data = await API.get('/recipes');
    const user = Auth.getUser();
    const myRecipes = (data.data || []).filter(r => r.user_id === user.id);

    const recipeCount = document.getElementById('stat-recipes');
    if (recipeCount) recipeCount.textContent = myRecipes.length;

    grid.innerHTML = '';
    if (!myRecipes.length) {
      grid.innerHTML = `<div class="empty-state-full">
        <span style="font-size:3rem">📝</span>
        <h3>No recipes yet</h3>
        <p>Share your first recipe with the world!</p>
        <a href="add-recipe.html" class="btn btn-primary">Add Recipe</a>
      </div>`;
      return;
    }
    myRecipes.forEach(recipe => {
      const card = createRecipeCard(recipe);
      // Add edit/delete buttons to card
      const footer = card.querySelector('.card-footer');
      if (footer) {
        const actions = document.createElement('div');
        actions.className = 'card-owner-actions';
        actions.innerHTML = `
          <button class="btn-icon btn-edit" data-id="${recipe.id}" title="Edit">✏️</button>
          <button class="btn-icon btn-delete" data-id="${recipe.id}" title="Delete">🗑️</button>
        `;
        footer.appendChild(actions);
        actions.querySelector('.btn-edit').addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = `add-recipe.html?edit=${recipe.id}`;
        });
        actions.querySelector('.btn-delete').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm('Delete this recipe permanently?')) return;
          try {
            await API.delete(`/recipes/${recipe.id}`);
            Toast.success('Recipe deleted');
            card.remove();
            updateStats();
          } catch (err) { Toast.error(err.message); }
        });
      }
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = '<div class="empty-state-full"><p>Failed to load recipes</p></div>';
    console.error(err);
  }
}

// ── Favorites ─────────────────────────────────────────────────
async function loadFavorites() {
  const grid = document.getElementById('favorites-grid');
  if (!grid) return;
  createSkeletonCards(3, grid);

  try {
    const data = await API.get('/favorites');
    const favorites = data.data || [];

    const favCount = document.getElementById('stat-favorites');
    if (favCount) favCount.textContent = favorites.length;

    grid.innerHTML = '';
    if (!favorites.length) {
      grid.innerHTML = `<div class="empty-state-full">
        <span style="font-size:3rem">❤️</span>
        <h3>No favorites yet</h3>
        <p>Start exploring and save recipes you love!</p>
        <a href="recipes.html" class="btn btn-primary">Explore Recipes</a>
      </div>`;
      return;
    }
    favorites.forEach(recipe => {
      recipe.isFavorited = true;
      grid.appendChild(createRecipeCard(recipe));
    });
  } catch (err) {
    grid.innerHTML = '<div class="empty-state-full"><p>Failed to load favorites</p></div>';
    console.error(err);
  }
}

// ── Stats ─────────────────────────────────────────────────────
function updateStats() {
  const user = Auth.getUser();
  const joinedEl = document.getElementById('stat-joined');
  if (joinedEl && user?.created_at) {
    joinedEl.textContent = new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
  }
}

// ── Tabs ──────────────────────────────────────────────────────
function initTabSwitcher() {
  const tabs = document.querySelectorAll('.profile-tab');
  const panels = document.querySelectorAll('.profile-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.dataset.panel;
      document.getElementById(targetId)?.classList.add('active');
    });
  });
}

// ── Edit Profile Modal ────────────────────────────────────────
function initEditProfileModal() {
  const editBtn = document.getElementById('edit-profile-btn');
  const modal = document.getElementById('edit-modal');
  const cancelBtn = document.getElementById('edit-cancel');
  const saveBtn = document.getElementById('edit-save');
  if (!editBtn || !modal) return;

  editBtn.addEventListener('click', () => {
    const user = Auth.getUser();
    if (document.getElementById('edit-username')) document.getElementById('edit-username').value = user?.username || '';
    if (document.getElementById('edit-bio')) document.getElementById('edit-bio').value = user?.bio || '';
    if (document.getElementById('edit-avatar')) document.getElementById('edit-avatar').value = user?.avatar || '';
    modal.classList.add('active');
  });

  cancelBtn?.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

  saveBtn?.addEventListener('click', async () => {
    const username = document.getElementById('edit-username')?.value.trim();
    const bio = document.getElementById('edit-bio')?.value.trim();
    const avatar = document.getElementById('edit-avatar')?.value.trim();
    if (!username || username.length < 3) { Toast.error('Username must be at least 3 characters'); return; }

    setButtonLoading(saveBtn, true, 'Saving...');
    try {
      const data = await API.put('/auth/profile', { username, bio, avatar });
      const user = Auth.getUser();
      Auth.setSession(Auth.getToken(), { ...user, username, bio, avatar });
      Toast.success('Profile updated! ✨');
      modal.classList.remove('active');
      loadProfileData();
    } catch (err) {
      Toast.error(err.message || 'Failed to update profile');
    } finally {
      setButtonLoading(saveBtn, false, 'Save Changes');
    }
  });
}
