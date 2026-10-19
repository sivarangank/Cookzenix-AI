// ============================================================
// auth.js - CookZenix AI Auth Page Logic
// Handles Sign In & Sign Up
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (Auth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  initSignIn();
  initSignUp();
  initPasswordStrength();
  initShowPassword();
});

// ── Sign In ───────────────────────────────────────────────────
function initSignIn() {
  const form = document.getElementById('signin-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('signin-btn');
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;

    if (!email || !password) {
      Toast.error('Please fill in all fields');
      return;
    }

    setButtonLoading(btn, true, 'Signing In...');
    clearFormErrors(form);

    try {
      const data = await API.post('/auth/login', { email, password });
      Auth.setSession(data.data.token, data.data.user);
      Toast.success(`Welcome back, ${data.data.user.username}! 🎉`);
      setTimeout(() => {
        const redirect = URLParams.get('redirect') || 'index.html';
        window.location.href = redirect;
      }, 1000);
    } catch (err) {
      Toast.error(err.message || 'Invalid email or password');
      showFieldError('signin-email', 'Invalid credentials');
      showFieldError('signin-password', 'Invalid credentials');
    } finally {
      setButtonLoading(btn, false, 'Sign In');
    }
  });

  // Social buttons (UI only)
  document.getElementById('google-btn')?.addEventListener('click', () => {
    Toast.info('Google Sign In coming soon! Please use email/password.');
  });
  document.getElementById('github-btn')?.addEventListener('click', () => {
    Toast.info('GitHub Sign In coming soon! Please use email/password.');
  });
}

// ── Sign Up ───────────────────────────────────────────────────
function initSignUp() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const btn = document.getElementById('signup-btn');
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const terms = document.getElementById('terms-checkbox')?.checked;

    // Validation
    if (!username || username.length < 3) {
      showFieldError('signup-username', 'Username must be at least 3 characters');
      return;
    }
    if (!email || !isValidEmail(email)) {
      showFieldError('signup-email', 'Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      showFieldError('signup-password', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      showFieldError('signup-confirm', 'Passwords do not match');
      return;
    }
    if (!terms) {
      Toast.warning('Please agree to the Terms of Service');
      return;
    }

    setButtonLoading(btn, true, 'Creating Account...');
    try {
      const data = await API.post('/auth/register', { username, email, password });
      Auth.setSession(data.data.token, data.data.user);
      Toast.success('Account created! Welcome to CookZenix AI! 🍽️');
      setTimeout(() => window.location.href = 'index.html', 1200);
    } catch (err) {
      Toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setButtonLoading(btn, false, 'Create Account');
    }
  });
}

// ── Password Strength ─────────────────────────────────────────
function initPasswordStrength() {
  const pwInput = document.getElementById('signup-password');
  const bar = document.getElementById('strength-bar');
  const label = document.getElementById('strength-label');
  if (!pwInput || !bar) return;

  pwInput.addEventListener('input', () => {
    const pw = pwInput.value;
    const strength = getPasswordStrength(pw);
    const levels = ['', 'weak', 'fair', 'good', 'strong'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#FF4444', '#FFA500', '#FFE66D', '#4CAF50'];

    bar.style.width = `${strength * 25}%`;
    bar.style.background = colors[strength];
    if (label) {
      label.textContent = labels[strength];
      label.style.color = colors[strength];
    }
  });
}

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || /[0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

// ── Show/Hide Password ────────────────────────────────────────
function initShowPassword() {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });
}

// ── Form Helpers ──────────────────────────────────────────────
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('input-error');
  const errorEl = document.createElement('span');
  errorEl.className = 'field-error';
  errorEl.textContent = message;
  const wrapper = field.closest('.form-group');
  if (wrapper && !wrapper.querySelector('.field-error')) {
    wrapper.appendChild(errorEl);
  }
  field.addEventListener('input', () => {
    field.classList.remove('input-error');
    wrapper?.querySelector('.field-error')?.remove();
  }, { once: true });
}

function clearFormErrors(form) {
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  form.querySelectorAll('.field-error').forEach(el => el.remove());
}

function setButtonLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.innerHTML = `<span class="spinner"></span> ${text}`;
  } else {
    btn.textContent = text || btn.dataset.originalText || 'Submit';
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
