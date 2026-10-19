// ============================================================
// main.js - CookZenix AI Shared JavaScript
// Handles: Auth state, Navbar, Toast, Chatbot init
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// ── Auth Helpers ──────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('cookzenix_token'),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('cookzenix_user')); }
    catch { return null; }
  },
  setSession: (token, user) => {
    localStorage.setItem('cookzenix_token', token);
    localStorage.setItem('cookzenix_user', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('cookzenix_token');
    localStorage.removeItem('cookzenix_user');
  },
  isLoggedIn: () => !!localStorage.getItem('cookzenix_token'),
};

// ── Toast Notifications ───────────────────────────────────────
const Toast = {
  container: null,
  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
  },
  show(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
      <div class="toast-progress"></div>
    `;
    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  info: (msg) => Toast.show(msg, 'info'),
  warning: (msg) => Toast.show(msg, 'warning'),
};

// ── API Helper ────────────────────────────────────────────────
const API = {
  async request(endpoint, options = {}) {
    const token = Auth.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    } catch (err) {
      throw err;
    }
  },
  get: (ep) => API.request(ep),
  post: (ep, body) => API.request(ep, { method: 'POST', body: JSON.stringify(body) }),
  put: (ep, body) => API.request(ep, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (ep) => API.request(ep, { method: 'DELETE' }),
};

// ── Global Form & Button Helpers ──────────────────────────────
function setButtonLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    if (!btn.dataset.originalText) {
      btn.dataset.originalText = btn.innerHTML;
    }
    btn.innerHTML = `<span class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-radius:50%;border-top-color:#fff;animation:spin 0.8s linear infinite;margin-right:6px;vertical-align:middle;"></span> ${text}`;
  } else {
    btn.innerHTML = text || btn.dataset.originalText || 'Submit';
  }
}

function showFieldError(fieldId, message) {
  const field = typeof fieldId === 'string' ? document.getElementById(fieldId) : fieldId;
  if (!field) return;
  field.classList.add('input-error');
  const errorEl = document.createElement('span');
  errorEl.className = 'field-error';
  errorEl.textContent = message;
  const wrapper = field.closest('.form-group') || field.parentElement;
  if (wrapper && !wrapper.querySelector('.field-error')) {
    wrapper.appendChild(errorEl);
  }
  field.addEventListener('input', () => {
    field.classList.remove('input-error');
    wrapper?.querySelector('.field-error')?.remove();
  }, { once: true });
}

function clearFormErrors(form) {
  if (!form) return;
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  form.querySelectorAll('.field-error').forEach(el => el.remove());
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Navbar ────────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const user = Auth.getUser();
  const authNav = document.getElementById('auth-nav');
  const addRecipeLink = document.getElementById('add-recipe-link');

  if (Auth.isLoggedIn() && user) {
    if (authNav) {
      authNav.innerHTML = `
        <a href="profile.html" class="nav-avatar" id="nav-profile-link" title="${user.username}">
          <div class="avatar-circle">${user.username.charAt(0).toUpperCase()}</div>
          <span>${user.username}</span>
        </a>
        <button class="btn btn-ghost btn-sm" id="logout-btn">Logout</button>
      `;
      document.getElementById('logout-btn')?.addEventListener('click', () => {
        Auth.clearSession();
        Toast.success('Logged out successfully!');
        setTimeout(() => window.location.href = 'index.html', 1000);
      });
    }
  }
  if (addRecipeLink) addRecipeLink.style.display = 'inline-flex';

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  });

  // Active link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  hamburger?.addEventListener('click', () => {
    navMenu?.classList.toggle('nav-open');
    hamburger.classList.toggle('open');
  });
}

// ── Rating Stars Display ──────────────────────────────────────
function renderStars(rating, max = 5) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    if (i <= Math.floor(rating)) html += '<span class="star star-filled">★</span>';
    else if (i - 0.5 <= rating) html += '<span class="star star-half">★</span>';
    else html += '<span class="star star-empty">★</span>';
  }
  return html;
}

// ── Recipe Card Generator ─────────────────────────────────────
function createRecipeCard(recipe) {
  const diffColor = { Easy: 'easy', Medium: 'medium', Hard: 'hard' };
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const card = document.createElement('div');
  card.className = 'recipe-card';
  card.dataset.id = recipe.id;
  let nutrition = {};
  if (recipe.nutrition) {
    if (typeof recipe.nutrition === 'object') nutrition = recipe.nutrition;
    else { try { nutrition = JSON.parse(recipe.nutrition); } catch {} }
  }
  const calBadge = nutrition && nutrition.calories ? `<span class="meta-item" style="color:var(--primary);font-weight:600;"><i class="fa-solid fa-fire"></i> ${nutrition.calories} kcal</span>` : '';

  card.innerHTML = `
    <div class="card-image-container">
      <img src="${recipe.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop'}"
           alt="${recipe.title}" class="card-image" loading="lazy"
           onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop'">
      <div class="card-image-overlay"></div>
      <span class="badge badge-category">${recipe.category || 'General'}</span>
      <button class="card-fav-btn ${recipe.isFavorited ? 'favorited' : ''}" data-id="${recipe.id}" title="Add to favorites">
        ${recipe.isFavorited ? '❤️' : '🤍'}
      </button>
    </div>
    <div class="card-body">
      <h3 class="card-title">${recipe.title}</h3>
      <p class="card-desc">${recipe.description || ''}</p>
      <div class="card-meta">
        <span class="meta-item"><i class="fa fa-clock"></i> ${totalTime}m</span>
        <span class="meta-item"><i class="fa fa-users"></i> ${recipe.servings || 4}</span>
        ${calBadge}
        <span class="meta-item badge badge-difficulty-${diffColor[recipe.difficulty] || 'medium'}">${recipe.difficulty || 'Medium'}</span>
      </div>
    </div>
    <div class="card-footer">
      <div class="card-rating">
        ${renderStars(recipe.rating || 4.5)}
        <span class="rating-num">${(recipe.rating || 4.5).toFixed(1)}</span>
      </div>
      <span class="card-cuisine badge badge-cuisine">${recipe.cuisine || ''}</span>
    </div>
  `;

  card.querySelector('.card-image-container').addEventListener('click', () => {
    window.location.href = `recipe-detail.html?id=${recipe.id}`;
  });
  card.querySelector('.card-title').addEventListener('click', () => {
    window.location.href = `recipe-detail.html?id=${recipe.id}`;
  });

  const favBtn = card.querySelector('.card-fav-btn');
  favBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!Auth.isLoggedIn()) {
      Toast.warning('Please sign in to save favorites!');
      return;
    }
    try {
      if (favBtn.classList.contains('favorited')) {
        await API.delete(`/favorites/${recipe.id}`);
        favBtn.classList.remove('favorited');
        favBtn.textContent = '🤍';
        Toast.info('Removed from favorites');
      } else {
        await API.post(`/favorites/${recipe.id}`, {});
        favBtn.classList.add('favorited');
        favBtn.textContent = '❤️';
        Toast.success('Added to favorites! ❤️');
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to update favorites');
    }
  });

  return card;
}

// ── Skeleton Loader ───────────────────────────────────────────
function createSkeletonCards(count = 6, container) {
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'recipe-card skeleton-card';
    sk.innerHTML = `
      <div class="skeleton skeleton-image"></div>
      <div class="card-body">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    `;
    container.appendChild(sk);
  }
}

// ── URL Params Helper ─────────────────────────────────────────
const URLParams = {
  get: (key) => new URLSearchParams(window.location.search).get(key),
  set: (params) => {
    const url = new URL(window.location);
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    });
    window.history.pushState({}, '', url);
  },
};

// ── Chatbot ───────────────────────────────────────────────────
function initChatbot() {
  if (typeof Chatbot !== 'undefined') {
    return; // Handled by chatbot.js
  }

  const widget = document.getElementById('chatbot-widget');
  const toggleBtn = document.getElementById('chatbot-toggle');
  const closeBtn = document.getElementById('chatbot-close');
  const sendBtn = document.getElementById('chatbot-send');
  const inputEl = document.getElementById('chatbot-input');
  const messagesEl = document.getElementById('chatbot-messages');

  if (!widget || !toggleBtn) return;

  // Toggle widget open/close
  toggleBtn.addEventListener('click', () => {
    widget.classList.toggle('is-open');
    if (widget.classList.contains('is-open') && messagesEl && !messagesEl.children.length) {
      addBotMessage("👋 Hi there! I'm **FoodieBot**, your AI culinary assistant. Ask me anything about recipes, cooking times, or ingredient substitutions!");
    }
    if (widget.classList.contains('is-open')) {
      setTimeout(() => inputEl?.focus(), 200);
    }
  });

  closeBtn?.addEventListener('click', () => {
    widget.classList.remove('is-open');
  });

  function addBotMessage(text) {
    if (!messagesEl) return;
    const msg = document.createElement('div');
    msg.className = 'chat-bubble chat-bubble-bot';
    msg.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addUserMessage(text) {
    if (!messagesEl) return;
    const msg = document.createElement('div');
    msg.className = 'chat-bubble chat-bubble-user';
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function handleSend() {
    const text = inputEl?.value.trim();
    if (!text) return;
    addUserMessage(text);
    inputEl.value = '';

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const data = await API.post('/chatbot', { message: text });
      typing.remove();
      addBotMessage(data.reply || data.message || "That sounds delicious! Let me know if you need any recipe suggestions.");
    } catch (err) {
      typing.remove();
      // Graceful smart local response if backend AI endpoint is not configured
      const reply = getLocalBotReply(text);
      addBotMessage(reply);
    }
  }

  function getLocalBotReply(prompt) {
    const q = prompt.toLowerCase();
    if (q.includes('pasta') || q.includes('spaghetti')) {
      return "🍝 For great pasta, salt your pasta water generously ('like the sea') and save half a cup of pasta water before draining to emulsify your sauce!";
    }
    if (q.includes('substitute') || q.includes('replace')) {
      return "🥄 Common substitutes: 1 cup buttermilk = 1 cup milk + 1 tbsp lemon juice; 1 egg = 1/4 cup unsweetened applesauce or mashed banana!";
    }
    if (q.includes('curry') || q.includes('spice')) {
      return "🍛 Toast your whole spices in a dry pan for 60 seconds before grinding or blooming in oil to release their essential aromatic oils!";
    }
    if (q.includes('pizza')) {
      return "🍕 For crispy crust at home, preheat your baking sheet or pizza stone at 250°C (480°F) for at least 30 minutes before baking!";
    }
    return "👩‍🍳 Great question! A touch of acid (lemon juice or vinegar) right at the end of cooking often balances rich flavors and makes dishes shine!";
  }

  sendBtn?.addEventListener('click', handleSend);
  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  initNavbar();
  initChatbot();
});
