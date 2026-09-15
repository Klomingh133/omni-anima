// Auth module for OmniAnima
(function() {
  'use strict';
  
  const API_BASE = '/api/auth';
  const TOKEN_KEY = 'omni_token';
  const USER_KEY = 'omni_user';
  const loaderStartedAt = Date.now();

  window.hideAppLoader = function(immediate = false) {
    const loader = document.getElementById('appLoader');
    if (!loader || loader.dataset.hidden) return;
    const wait = immediate ? 0 : Math.min(200, Math.max(0, 250 - (Date.now() - loaderStartedAt)));
    setTimeout(() => {
      loader.dataset.hidden = 'true';
      loader.classList.add('is-hidden');
    }, wait);
  };

  // Absolute safety timeout: ensure loader NEVER hangs over 800ms
  setTimeout(() => {
    window.hideAppLoader?.(true);
  }, 800);

  function clearStoredAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('omni_editor_state');
    localStorage.removeItem('sketsa_token');
    localStorage.removeItem('sketsa_user');
  }

  function isUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  function getLegacyToken() {
    return localStorage.getItem('sketsa_token') || null;
  }

  function getLegacyUser() {
    const raw = localStorage.getItem('sketsa_user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function migrateLegacyAuth() {
    const legacyToken = getLegacyToken();
    const legacyUser = getLegacyUser();
    if (!legacyToken) return;
    if (!localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, legacyToken);
    }
    if (!localStorage.getItem(USER_KEY) && legacyUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(legacyUser));
    }
    localStorage.removeItem('sketsa_token');
    localStorage.removeItem('sketsa_user');
  }

  // Check if already logged in
  function checkAuth() {
    migrateLegacyAuth();
    const token = localStorage.getItem(TOKEN_KEY) || getLegacyToken();
    if (!token) return;

    fetch(API_BASE + '/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401 || r.status === 403) {
            clearStoredAuth();
          }
          return;
        }

        const data = await r.json().catch(() => null);
        const user = data?.data?.user || data?.data || data?.user || null;

        if (user && isUuid(user.id)) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          window.location.href = '/app';
          return;
        }

        clearStoredAuth();
      })
      .catch(() => {
        // Do not aggressively clear storage on network errors
      });
  }

  // Tab switching
  function initTabs() {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (!tabLogin) return;

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    });
  }

  // Show/hide error
  function showError(formId, message) {
    const errorEl = document.getElementById(formId === 'login' ? 'loginError' : 'registerError');
    if (!errorEl) return;
    
    if (message) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    } else {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    }
  }

  // Set loading state on button
  function setLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.textContent;
      btn.textContent = 'Processing...';
    } else {
      btn.disabled = false;
      if (btn.dataset.originalText) {
        btn.textContent = btn.dataset.originalText;
      }
    }
  }

  // Login handler
  async function handleLogin(e) {
    e.preventDefault();
    const login = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    showError('login', null);
    
    if (!login || !password) {
      showError('login', 'Please enter your username/email and password.');
      return;
    }

    setLoading('loginBtn', true);

    try {
      clearStoredAuth();

      const res = await fetch(API_BASE + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      
      const resData = await res.json();
      
      if (res.ok && resData.data && resData.data.token) {
        localStorage.setItem(TOKEN_KEY, resData.data.token);
        if (resData.data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(resData.data.user));
        }
        window.location.href = '/app';
      } else {
        showError('login', resData.message || 'Sign in failed. Please verify your credentials.');
      }
    } catch (err) {
      showError('login', 'A network error occurred. Please try again.');
    } finally {
      setLoading('loginBtn', false);
    }
  }

  // Register handler  
  async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    
    showError('register', null);

    if (!username || !email || !password || !confirm) {
      showError('register', 'Please fill in all fields.');
      return;
    }

    if (password !== confirm) {
      showError('register', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      showError('register', 'Password must be at least 6 characters.');
      return;
    }

    setLoading('registerBtn', true);

    try {
      clearStoredAuth();

      const res = await fetch(API_BASE + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const resData = await res.json();
      
      if (res.ok && resData.data && resData.data.token) {
        localStorage.setItem(TOKEN_KEY, resData.data.token);
        if (resData.data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(resData.data.user));
        }
        window.location.href = '/app';
      } else {
        showError('register', resData.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      showError('register', 'A network error occurred. Please try again.');
    } finally {
      setLoading('registerBtn', false);
    }
  }

  // SVG Icons for password toggle
  const EYE_OPEN_SVG = `<svg class="icon-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const EYE_OFF_SVG = `<svg class="icon-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  // Toggle show/hide password
  function initPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.toggle-password');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const inputId = btn.getAttribute('data-target');
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = EYE_OFF_SVG;
          btn.title = 'Hide password';
          btn.setAttribute('aria-label', 'Hide password');
        } else {
          input.type = 'password';
          btn.innerHTML = EYE_OPEN_SVG;
          btn.title = 'Show password';
          btn.setAttribute('aria-label', 'Show password');
        }
      });
    });
  }

  // Interactive Particle & Mesh Background for Auth (ReactBits / MotionSites)
  function initInteractiveBackground() {
    const canvas = document.getElementById('authCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width * 0.5, y: height * 0.5, targetX: width * 0.5, targetY: height * 0.5 };

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    });

    window.addEventListener('pointermove', (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    });

    const NODE_COUNT = Math.min(38, Math.floor((width * height) / 28000));
    let nodes = [];

    function initNodes() {
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2 + 1.5,
          alpha: Math.random() * 0.35 + 0.25
        });
      }
    }
    initNodes();

    let animId;
    function render() {
      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Draw interactive grid lines
      const gridSize = 48;
      ctx.strokeStyle = 'rgba(91, 63, 209, 0.028)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Connect nodes
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;

        if (a.x < 0) a.x = width;
        if (a.x > width) a.x = 0;
        if (a.y < 0) a.y = height;
        if (a.y > height) a.y = 0;

        // Subtle mouse pull
        const dxM = mouse.x - a.x;
        const dyM = mouse.y - a.y;
        const distM = Math.hypot(dxM, dyM);
        if (distM < 180) {
          const force = (180 - distM) / 180 * 0.008;
          a.x += dxM * force;
          a.y += dyM * force;
        }

        // Draw connections between close nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140) {
            const lineAlpha = (1 - dist / 140) * 0.16;
            ctx.strokeStyle = `rgba(91, 63, 209, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // Draw node
        ctx.fillStyle = `rgba(91, 63, 209, ${a.alpha})`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    }
    render();
  }

  // Global helper for authenticated API calls (used by other JS files)
  window.apiFetch = async function(url, options = {}) {
    migrateLegacyAuth();
    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('sketsa_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const user = window.getUser();
    if (user && !isUuid(user.id)) {
      clearStoredAuth();
      window.location.href = '/login';
      return;
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      ...(options.headers || {})
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      clearStoredAuth();
      window.location.href = '/login';
      return;
    }
    return res.json();
  };

  window.getUser = function() {
    migrateLegacyAuth();
    try {
      const raw = localStorage.getItem(USER_KEY) || localStorage.getItem('sketsa_user');
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return isUuid(parsed?.id) ? parsed : null;
    } catch (e) {
      return null;
    }
  };

  window.logout = function() {
    clearStoredAuth();
    window.location.href = '/login';
  };

  function initAuthPage() {
    if (!document.getElementById('authCard')) return;
    
    checkAuth();
    initTabs();
    initPasswordToggles();
    initInteractiveBackground();
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    const token = localStorage.getItem(TOKEN_KEY) || getLegacyToken();
    window.hideAppLoader(!token); // Hide immediately if unauthenticated
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthPage);
  } else {
    initAuthPage();
  }
})();
