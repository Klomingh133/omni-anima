(function() {
  'use strict';

  const API = '/api/projects';
  const PUBLISHED_API = '/api/published';
  const EDITOR_STATE_KEY = 'omni_editor_state';

  let projects = [];
  let publishedFeed = [];
  let currentTab = 'studio'; // 'studio' | 'explore'
  let studioSearchQuery = '';
  let exploreSearchQuery = '';

  function getEditorState() {
    try {
      const raw = localStorage.getItem(EDITOR_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveEditorState(mode, projectId = null, frameIndex = 0) {
    localStorage.setItem(EDITOR_STATE_KEY, JSON.stringify({ mode, projectId, frameIndex }));
  }

  function clearEditorState() {
    localStorage.removeItem(EDITOR_STATE_KEY);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2500);
  }
  window.showToast = toast;

  /* ==========================================================================
     MODALS & DIALOGS
     ========================================================================== */

  window.showInputDialog = function({
    title = 'Input',
    label = '',
    placeholder = '',
    defaultValue = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  } = {}) {
    return new Promise((resolve) => {
      const root = document.getElementById('dialogRoot');
      if (!root) { resolve(null); return; }

      const close = (value) => {
        root.classList.add('hidden');
        root.innerHTML = '';
        resolve(value);
      };

      root.classList.remove('hidden');
      root.innerHTML = `
        <div class="dialog-backdrop" data-close="true"></div>
        <div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialogTitle">
          <div class="dialog-header">
            <div class="dialog-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <div class="dialog-header-text">
              <h3 id="dialogTitle">${escapeHtml(title)}</h3>
            </div>
          </div>
          <div class="dialog-body-fields">
            <div class="field-group">
              ${label ? `<label class="dialog-label" for="dialogInput">${escapeHtml(label)}</label>` : ''}
              <div class="dialog-input-wrap">
                <input id="dialogInput" type="text" value="${escapeHtml(defaultValue)}" placeholder="${escapeHtml(placeholder)}" />
              </div>
            </div>
          </div>
          <div class="dialog-actions">
            <button type="button" class="dialog-cancel">${escapeHtml(cancelText)}</button>
            <button type="button" class="dialog-confirm btn-accent">${escapeHtml(confirmText)}</button>
          </div>
        </div>
      `;

      const input = root.querySelector('#dialogInput');
      const cancelBtn = root.querySelector('.dialog-cancel');
      const confirmBtn = root.querySelector('.dialog-confirm');
      const backdrop = root.querySelector('.dialog-backdrop');

      const submit = () => {
        const val = input.value.trim();
        close(val || null);
      };

      input?.focus();
      input?.select();
      cancelBtn?.addEventListener('click', () => close(null));
      confirmBtn?.addEventListener('click', submit);
      backdrop?.addEventListener('click', (event) => {
        if (event.target === backdrop) close(null);
      });
      input?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') submit();
        if (event.key === 'Escape') close(null);
      });
    });
  };

  window.showConfirmDialog = function({
    title = 'Confirmation',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  } = {}) {
    return new Promise((resolve) => {
      const root = document.getElementById('dialogRoot');
      if (!root) { resolve(false); return; }

      const close = (value) => {
        root.classList.add('hidden');
        root.innerHTML = '';
        resolve(value);
      };

      root.classList.remove('hidden');
      root.innerHTML = `
        <div class="dialog-backdrop" data-close="true"></div>
        <div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
          <h3 id="confirmTitle">${escapeHtml(title)}</h3>
          <p class="dialog-message">${escapeHtml(message)}</p>
          <div class="dialog-actions">
            <button type="button" class="dialog-cancel">${escapeHtml(cancelText)}</button>
            <button type="button" class="dialog-confirm">${escapeHtml(confirmText)}</button>
          </div>
        </div>
      `;

      const cancelBtn = root.querySelector('.dialog-cancel');
      const confirmBtn = root.querySelector('.dialog-confirm');
      const backdrop = root.querySelector('.dialog-backdrop');

      cancelBtn?.addEventListener('click', () => close(false));
      confirmBtn?.addEventListener('click', () => close(true));
      backdrop?.addEventListener('click', (event) => {
        if (event.target === backdrop) close(false);
      });
      document.addEventListener('keydown', function keydownHandler(event) {
        if (event.key === 'Escape') {
          document.removeEventListener('keydown', keydownHandler);
          close(false);
        }
      }, { once: true });
    });
  };

  /**
   * Photo 2: Dedicated Modern "New Animation Project" Dialog
   * Fully redesigned modal with interactive frame selector (default 8 frames, presets 4/8/12/16/24, stepper, duration helper)
   */
  window.showNewProjectDialog = function({ defaultName = 'New Animation' } = {}) {
    return new Promise((resolve) => {
      const root = document.getElementById('dialogRoot');
      if (!root) { resolve(null); return; }

      let selectedFrames = 8; // Default 8 frames as requested

      const close = (result) => {
        root.classList.add('hidden');
        root.innerHTML = '';
        resolve(result);
      };

      root.classList.remove('hidden');
      root.innerHTML = `
        <div class="dialog-backdrop" data-close="true"></div>
        <div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="newProjTitle" style="max-width: 480px;">
          <div class="dialog-header">
            <div class="dialog-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="2" y1="7" x2="7" y2="7"></line>
                <line x1="2" y1="17" x2="7" y2="17"></line>
                <line x1="17" y1="17" x2="22" y2="17"></line>
                <line x1="17" y1="7" x2="22" y2="7"></line>
              </svg>
            </div>
            <div class="dialog-header-text">
              <h3 id="newProjTitle">New Animation Project</h3>
              <p class="dialog-subtitle">Set project title and initial frame timeline.</p>
            </div>
          </div>

          <div class="dialog-body-fields">
            <div class="field-group">
              <label class="dialog-label" for="projNameInput">Project Title</label>
              <div class="dialog-input-wrap">
                <svg class="dialog-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <input id="projNameInput" class="dialog-input-with-icon" type="text" value="${escapeHtml(defaultName)}" placeholder="e.g. Bouncing Ball, Character Walk..." maxlength="100" />
              </div>
            </div>

            <div class="field-group">
              <div class="dialog-label">
                <span>Initial Frames</span>
                <span class="helper-badge" id="frameDurationHelper">~0.67s @ 12 FPS</span>
              </div>
              
              <div class="frame-selector-box">
                <div class="frame-presets-row" id="framePresetsRow">
                  <button type="button" class="frame-chip" data-frames="4">
                    <span class="chip-num">4</span>
                    <span class="chip-sub">Fast</span>
                  </button>
                  <button type="button" class="frame-chip active" data-frames="8">
                    <span class="chip-num">8</span>
                    <span class="chip-sub">Default</span>
                  </button>
                  <button type="button" class="frame-chip" data-frames="12">
                    <span class="chip-num">12</span>
                    <span class="chip-sub">1s Loop</span>
                  </button>
                  <button type="button" class="frame-chip" data-frames="16">
                    <span class="chip-num">16</span>
                    <span class="chip-sub">Fluid</span>
                  </button>
                  <button type="button" class="frame-chip" data-frames="24">
                    <span class="chip-num">24</span>
                    <span class="chip-sub">2s Film</span>
                  </button>
                </div>

                <div class="frame-stepper-row">
                  <span class="stepper-label">Custom Frame Count (1 - 60):</span>
                  <div class="stepper-controls">
                    <button type="button" class="stepper-btn" id="stepDec" title="Decrease frame count">−</button>
                    <input type="number" id="stepValInput" class="stepper-val-input" min="1" max="60" value="8" />
                    <button type="button" class="stepper-btn" id="stepInc" title="Increase frame count">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <button type="button" class="dialog-cancel">Cancel</button>
            <button type="button" class="dialog-confirm btn-accent" id="confirmNewProjBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px;">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Create Project</span>
            </button>
          </div>
        </div>
      `;

      const nameInput = root.querySelector('#projNameInput');
      const helper = root.querySelector('#frameDurationHelper');
      const presetsRow = root.querySelector('#framePresetsRow');
      const stepInput = root.querySelector('#stepValInput');
      const stepDec = root.querySelector('#stepDec');
      const stepInc = root.querySelector('#stepInc');
      const cancelBtn = root.querySelector('.dialog-cancel');
      const confirmBtn = root.querySelector('#confirmNewProjBtn');
      const backdrop = root.querySelector('.dialog-backdrop');

      const updateUI = (count) => {
        selectedFrames = Math.max(1, Math.min(60, Math.round(count) || 8));
        stepInput.value = selectedFrames;
        const durationSec = (selectedFrames / 12).toFixed(2);
        helper.textContent = `~${durationSec}s @ 12 FPS`;

        presetsRow.querySelectorAll('.frame-chip').forEach(chip => {
          const chipVal = parseInt(chip.dataset.frames, 10);
          chip.classList.toggle('active', chipVal === selectedFrames);
        });
      };

      presetsRow.addEventListener('click', (e) => {
        const chip = e.target.closest('.frame-chip');
        if (!chip) return;
        const frames = parseInt(chip.dataset.frames, 10);
        updateUI(frames);
      });

      stepDec.addEventListener('click', () => updateUI(selectedFrames - 1));
      stepInc.addEventListener('click', () => updateUI(selectedFrames + 1));
      stepInput.addEventListener('input', () => updateUI(parseInt(stepInput.value, 10)));

      const submit = () => {
        const name = nameInput.value.trim() || 'New Animation';
        close({ name, frameCount: selectedFrames });
      };

      cancelBtn?.addEventListener('click', () => close(null));
      confirmBtn?.addEventListener('click', submit);
      backdrop?.addEventListener('click', (e) => {
        if (e.target === backdrop) close(null);
      });

      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') close(null);
      });

      nameInput.focus();
      nameInput.select();
    });
  };

  /**
   * Custom Publish Modal with title and description fields
   */
  function showPublishDialog(defaultTitle = 'My Animation', defaultDesc = '') {
    return new Promise((resolve) => {
      const root = document.getElementById('dialogRoot');
      if (!root) { resolve(null); return; }

      const close = (data) => {
        root.classList.add('hidden');
        root.innerHTML = '';
        resolve(data);
      };

      root.classList.remove('hidden');
      root.innerHTML = `
        <div class="dialog-backdrop" data-close="true"></div>
        <div class="dialog-card publish-dialog-card" role="dialog" aria-modal="true" aria-labelledby="publishTitle">
          <div class="dialog-icon-header">
            <div class="dialog-badge-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            </div>
            <div>
              <h3 id="publishTitle">Publish to Community</h3>
              <p class="dialog-subtitle">Share your animation with animators and viewers worldwide.</p>
            </div>
          </div>
          
          <div class="dialog-body-fields">
            <div class="field-group">
              <label class="dialog-label" for="pubTitle">Animation Title <span class="required">*</span></label>
              <input id="pubTitle" type="text" value="${escapeHtml(defaultTitle)}" placeholder="Give your animation an eye-catching title" maxlength="120" required />
            </div>

            <div class="field-group">
              <label class="dialog-label" for="pubDesc">Description <span class="optional">(Optional)</span></label>
              <textarea id="pubDesc" rows="3" placeholder="Tell the community about your story, technique, or inspiration...">${escapeHtml(defaultDesc)}</textarea>
            </div>

            <div class="publish-notice-banner">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>A high-definition WebM video will be automatically compiled from your frames for public viewing, downloading, and remixing.</span>
            </div>
          </div>

          <div class="dialog-actions">
            <button type="button" class="dialog-cancel">Cancel</button>
            <button type="button" class="dialog-confirm btn-glow" id="pubSubmitBtn">
              <svg viewBox="0 0 24 24" aria-hidden="true" style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2"><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
              <span>Publish Now</span>
            </button>
          </div>
        </div>
      `;

      const titleInput = root.querySelector('#pubTitle');
      const descInput = root.querySelector('#pubDesc');
      const cancelBtn = root.querySelector('.dialog-cancel');
      const submitBtn = root.querySelector('#pubSubmitBtn');
      const backdrop = root.querySelector('.dialog-backdrop');

      const submit = () => {
        const title = titleInput.value.trim();
        if (!title) {
          titleInput.focus();
          titleInput.classList.add('error');
          return;
        }
        close({ title, description: descInput.value.trim() });
      };

      titleInput?.focus();
      cancelBtn?.addEventListener('click', () => close(null));
      submitBtn?.addEventListener('click', submit);
      backdrop?.addEventListener('click', (event) => {
        if (event.target === backdrop) close(null);
      });
      titleInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') submit();
        if (event.key === 'Escape') close(null);
      });
    });
  }

  /**
   * Progress modal for video compiling and extraction
   */
  function showProgressModal(title, initialStatus) {
    const root = document.getElementById('dialogRoot');
    if (!root) return { update: () => {}, close: () => {} };

    root.classList.remove('hidden');
    root.innerHTML = `
      <div class="dialog-backdrop"></div>
      <div class="dialog-card progress-dialog-card" role="dialog" aria-modal="true">
        <div class="progress-spinner">
          <svg viewBox="0 0 50 50" class="spinner-svg">
            <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
          </svg>
        </div>
        <h3 class="progress-title">${escapeHtml(title)}</h3>
        <p class="progress-status" id="progressStatusText">${escapeHtml(initialStatus)}</p>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" id="progressBarFill" style="width: 0%"></div>
        </div>
        <span class="progress-percent mono" id="progressPercentText">0%</span>
      </div>
    `;

    const statusText = root.querySelector('#progressStatusText');
    const barFill = root.querySelector('#progressBarFill');
    const percentText = root.querySelector('#progressPercentText');

    return {
      update: (ratio, msg) => {
        const percent = Math.min(100, Math.max(0, Math.round(ratio * 100)));
        if (barFill) barFill.style.width = percent + '%';
        if (percentText) percentText.textContent = percent + '%';
        if (msg && statusText) statusText.textContent = msg;
      },
      close: () => {
        root.classList.add('hidden');
        root.innerHTML = '';
      }
    };
  }

  /* ==========================================================================
     AUTHENTICATION & INITIALIZATION
     ========================================================================== */

  async function init() {
    const user = window.getUser();
    if (!user) {
      clearEditorState();
      window.location.href = '/login';
      return;
    }

    const resolvedUser = user;
    const triggerName = document.getElementById('triggerName');
    const dropdownName = document.getElementById('dropdownName');
    const dropdownEmail = document.getElementById('dropdownEmail');

    if (triggerName) triggerName.textContent = resolvedUser.username;
    if (dropdownName) dropdownName.textContent = resolvedUser.username;
    if (dropdownEmail) dropdownEmail.textContent = resolvedUser.email;

    updateAvatarUI(resolvedUser.avatar_url, resolvedUser.username, resolvedUser.email);
    setupProfileMenu();
    setupNavigation();
    setupUploadHandler();

    // Reveal UI immediately without blocking on network requests
    window.hideAppLoader?.(true);

    // Asynchronously refresh user profile from server in background
    window.apiFetch('/api/auth/me').then(res => {
      if (res && res.success && res.data) {
        const freshUser = { ...resolvedUser, ...res.data };
        localStorage.setItem('omni_user', JSON.stringify(freshUser));
        if (triggerName) triggerName.textContent = freshUser.username;
        if (dropdownName) dropdownName.textContent = freshUser.username;
        if (dropdownEmail) dropdownEmail.textContent = freshUser.email;
        updateAvatarUI(freshUser.avatar_url, freshUser.username, freshUser.email);
      }
    }).catch(() => {});

    // Restore editor session if active
    const savedState = getEditorState();
    if (savedState && savedState.mode === 'editor' && savedState.projectId) {
      const data = await window.apiFetch(API + '/' + savedState.projectId);
      if (data && data.success) {
        document.querySelector('.app-navbar')?.classList.add('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('explore').classList.add('hidden');
        document.getElementById('editor').classList.remove('hidden');
        window.EditorModule.open(data.data);
        if (typeof savedState.frameIndex === 'number' && data.data.frames && data.data.frames[savedState.frameIndex]) {
          setTimeout(() => {
            const currentFrame = Number(savedState.frameIndex) || 0;
            if (window.EditorModule && typeof window.EditorModule.setCurrentFrame === 'function') {
              window.EditorModule.setCurrentFrame(currentFrame);
            }
          }, 0);
        }
        window.hideAppLoader?.(true);
        return;
      }
    }

    await loadProjects();
    window.hideAppLoader?.(true);
  }

  // Guaranteed safety timeout for the entire studio screen
  setTimeout(() => {
    window.hideAppLoader?.(true);
  }, 500);

  /* ==========================================================================
     TAB NAVIGATION (My Studio vs Explore Community)
     ========================================================================== */

  function setupNavigation() {
    const tabStudio = document.getElementById('tabStudio');
    const tabExplore = document.getElementById('tabExplore');
    const dashboardSec = document.getElementById('dashboard');
    const exploreSec = document.getElementById('explore');
    const editorSec = document.getElementById('editor');

    function switchTab(tab) {
      currentTab = tab;
      if (editorSec) editorSec.classList.add('hidden');

      if (tab === 'studio') {
        tabStudio?.classList.add('active');
        tabExplore?.classList.remove('active');
        dashboardSec?.classList.remove('hidden');
        exploreSec?.classList.add('hidden');
        loadProjects();
      } else if (tab === 'explore') {
        tabExplore?.classList.add('active');
        tabStudio?.classList.remove('active');
        exploreSec?.classList.remove('hidden');
        dashboardSec?.classList.add('hidden');
        loadPublishedFeed();
      }
    }

    tabStudio?.addEventListener('click', () => switchTab('studio'));
    tabExplore?.addEventListener('click', () => switchTab('explore'));

    window.switchViewTab = switchTab;
  }

  /* ==========================================================================
     MY STUDIO (Projects Management)
     ========================================================================== */

  async function loadProjects() {
    const data = await window.apiFetch(API);
    if (!data || !data.success) return;
    projects = data.data;

    // Update statistics
    const statProjects = document.getElementById('statProjects');
    const statFrames = document.getElementById('statFrames');
    if (statProjects) statProjects.textContent = projects.length;
    if (statFrames) {
      const totalFrames = projects.reduce((sum, p) => sum + (p.frame_count || 0), 0);
      statFrames.textContent = totalFrames;
    }
    const countBadge = document.getElementById('projectCountBadge');
    if (countBadge) countBadge.textContent = projects.length;

    renderProjects();
  }

  function renderProjects() {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const countBadge = document.getElementById('projectCountBadge');
    if (countBadge) countBadge.textContent = projects.length;

    const filteredProjects = studioSearchQuery
      ? projects.filter(p => (p.name || '').toLowerCase().includes(studioSearchQuery.toLowerCase()))
      : projects;

    if (!projects.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎨</div>
          <b>No projects yet</b>
          <p>Create your first animation by clicking <strong>"New Project"</strong> or selecting a quick-start rhythm above.</p>
        </div>
      `;
      return;
    }

    if (!filteredProjects.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <b>No matching projects</b>
          <p>No animations found matching "<em>${escapeHtml(studioSearchQuery)}</em>".</p>
        </div>
      `;
      return;
    }

    filteredProjects.forEach(p => {
      const card = document.createElement('article');
      card.className = 'project-card';
      const thumb = p.thumbnail;
      const date = new Date(p.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      card.innerHTML = `
        <div class="thumb" role="button" tabindex="0" title="Open ${escapeHtml(p.name)} in Studio">
          ${thumb ? `<img src="${thumb}" alt="${escapeHtml(p.name)}">` : '<span class="thumb-empty">✦ Blank Canvas</span>'}
          <div class="thumb-hover-overlay">
            <span class="open-badge">Open Studio →</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-header-row">
            <div class="card-title-meta">
              <div class="card-name" role="button" tabindex="0" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
              <div class="card-meta"><span class="mono">${p.frame_count || 1}</span> frames · <span class="mono">${date}</span></div>
            </div>
            <div class="project-menu-wrap">
              <button class="project-menu-trigger" type="button" title="Project options" aria-label="Project options" aria-expanded="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
              </button>
              <div class="project-menu hidden" role="menu">
                <button class="publish-project" type="button" role="menuitem">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                  <span>Publish to Community</span>
                </button>
                <button class="rename-project" type="button" role="menuitem">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 4 6 6M3 21l3.5-1L18 8l-5-5L1.5 14.5 3 21Z"/><path d="m11 5 5 5"/></svg>
                  <span>Rename</span>
                </button>
                <button class="delete-project" type="button" role="menuitem">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5"/></svg>
                  <span>Delete project</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      card.querySelector('.thumb').onclick = () => openProject(p.id);
      card.querySelector('.card-name').onclick = () => openProject(p.id);

      const menuTrigger = card.querySelector('.project-menu-trigger');
      const projectMenu = card.querySelector('.project-menu');

      menuTrigger.onclick = (e) => {
        e.stopPropagation();
        const isOpen = projectMenu.classList.toggle('hidden');
        menuTrigger.setAttribute('aria-expanded', String(!isOpen));
      };

      // Publish Action
      card.querySelector('.publish-project').onclick = async (e) => {
        e.stopPropagation();
        projectMenu.classList.add('hidden');
        await handlePublishProject(p);
      };

      // Rename Action
      card.querySelector('.rename-project').onclick = async (e) => {
        e.stopPropagation();
        projectMenu.classList.add('hidden');
        const name = await window.showInputDialog({
          title: 'Rename Project',
          label: 'Project Name',
          defaultValue: p.name,
          confirmText: 'Save',
          cancelText: 'Cancel'
        });
        if (!name || name === p.name) return;
        const res = await window.apiFetch(API + '/' + p.id, {
          method: 'PUT',
          body: JSON.stringify({ name })
        });
        if (res?.success) {
          toast('Project renamed.');
          await loadProjects();
        } else {
          toast(res?.message || 'Failed to rename project.');
        }
      };

      // Delete Action
      card.querySelector('.delete-project').onclick = async (e) => {
        e.stopPropagation();
        projectMenu.classList.add('hidden');
        const confirmed = await window.showConfirmDialog({
          title: 'Delete Project',
          message: `Are you sure you want to delete "${p.name}"? This action cannot be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel'
        });
        if (!confirmed) return;
        const res = await window.apiFetch(API + '/' + p.id, { method: 'DELETE' });
        if (res && res.success) {
          toast('Project deleted.');
          await loadProjects();
        } else {
          toast(res ? res.message : 'Failed to delete project.');
        }
      };

      grid.appendChild(card);
    });
  }

  async function newProject(defaultName = '') {
    if (typeof defaultName !== 'string') defaultName = '';
    const config = await window.showNewProjectDialog({
      defaultName: defaultName || 'New Animation'
    });
    if (!config) return;

    const res = await window.apiFetch(API, {
      method: 'POST',
      body: JSON.stringify({
        name: config.name,
        frameCount: config.frameCount
      })
    });
    if (res && res.success) {
      toast(`Project created with ${config.frameCount} frames!`);
      openProject(res.data.id);
    } else {
      toast(res?.message || 'Failed to create project.');
    }
  }

  window.startTemplate = async function(fps, name) {
    const res = await window.apiFetch(API, {
      method: 'POST',
      body: JSON.stringify({ name, fps })
    });
    if (res && res.success) {
      toast(`${name} template loaded (${fps} FPS)`);
      openProject(res.data.id);
    } else {
      toast('Failed to start template.');
    }
  };

  async function openProject(id) {
    const data = await window.apiFetch(API + '/' + id);
    if (!data || !data.success) {
      toast(data ? data.message : 'Failed to open project.');
      return;
    }

    const currentUser = window.getUser();
    if (currentUser && data.data.user_id && String(data.data.user_id) !== String(currentUser.id)) {
      toast('This project does not belong to your account.');
      await loadProjects();
      return;
    }

    saveEditorState('editor', id, 0);

    if (window.EditorModule) {
      document.querySelector('.app-navbar')?.classList.add('hidden');
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('explore').classList.add('hidden');
      document.getElementById('editor').classList.remove('hidden');
      window.EditorModule.open(data.data);
    } else {
      console.error('EditorModule is not loaded');
      toast('Editor failed to load.');
    }
  }

  window.closeToDashboard = async function() {
    clearEditorState();
    document.querySelector('.app-navbar')?.classList.remove('hidden');
    document.getElementById('editor').classList.add('hidden');
    if (window.switchViewTab) {
      window.switchViewTab('studio');
    } else {
      document.getElementById('dashboard').classList.remove('hidden');
      await loadProjects();
    }
  };

  window.persistEditorState = function(projectId, frameIndex = 0) {
    saveEditorState('editor', projectId, frameIndex);
  };

  /* ==========================================================================
     PUBLISHING SYSTEM (Convert animation frames to video & publish)
     ========================================================================== */

  async function handlePublishProject(project) {
    // Pre-check if current user has reached the 5-video publish limit
    try {
      const feedCheck = await window.apiFetch(PUBLISHED_API, { public: true });
      if (feedCheck && feedCheck.success && Array.isArray(feedCheck.data)) {
        const userPublishedCount = feedCheck.data.filter(item => item.user_id === currentUser.id).length;
        if (userPublishedCount >= 5) {
          await window.showAlertDialog?.({
            title: 'Upload Limit Reached (5/5)',
            message: 'You have already published 5 animations to Explore Community (maximum limit: 5). Please delete an existing community video before publishing another.',
            confirmText: 'Understood'
          });
          return;
        }
      }
    } catch (e) {
      // Continue to dialog if check fails
    }

    const details = await showPublishDialog(project.name, '');
    if (!details) return;

    const progressModal = showProgressModal('Compiling Video Animation', 'Loading project frames...');

    try {
      // 1. Fetch full project details including all frame images
      const projRes = await window.apiFetch(API + '/' + project.id);
      if (!projRes || !projRes.success || !projRes.data) {
        throw new Error('Could not retrieve project data.');
      }
      const fullProj = projRes.data;
      const frames = fullProj.frames || [];

      if (!frames.length) {
        throw new Error('The animation project has no frames to publish.');
      }

      progressModal.update(0.15, 'Rendering WebM video from frames...');

      // 2. Render frames to high quality WebM video using window.VideoEngine
      const videoResult = await window.VideoEngine.renderFramesToVideo(
        frames,
        fullProj.fps || 12,
        (ratio) => {
          progressModal.update(0.2 + ratio * 0.65, `Rendering video frames (${Math.round(ratio * 100)}%)...`);
        }
      );

      progressModal.update(0.9, 'Publishing animation to Community showcase...');

      // 3. Post to published community feed
      const publishRes = await window.apiFetch(PUBLISHED_API, {
        method: 'POST',
        body: JSON.stringify({
          projectId: project.id,
          title: details.title,
          description: details.description,
          fps: fullProj.fps || 12,
          frame_count: frames.length,
          thumbnail: fullProj.thumbnail || (frames[0]?.image_data || frames[0]),
          video_data: videoResult.dataUrl
        })
      });

      if (!publishRes || !publishRes.success) {
        throw new Error(publishRes?.message || 'Failed to publish animation.');
      }

      progressModal.update(1.0, 'Published successfully!');
      setTimeout(() => {
        progressModal.close();
        toast('🎉 Animation published to Explore Community!');
        if (window.switchViewTab) {
          window.switchViewTab('explore');
        }
      }, 500);

    } catch (err) {
      console.error('Publish error:', err);
      progressModal.close();
      toast('Failed to publish: ' + (err.message || 'Unknown error'));
    }
  }

  /* ==========================================================================
     EXPLORE COMMUNITY (Public Video Feed, Downloads, Remixing)
     ========================================================================== */

  async function loadPublishedFeed() {
    const grid = document.getElementById('exploreGrid');
    const countBadge = document.getElementById('exploreCountBadge');

    try {
      let url = PUBLISHED_API;
      if (exploreSearchQuery) {
        url += `?q=${encodeURIComponent(exploreSearchQuery)}`;
      }
      const res = await window.apiFetch(url, { public: true });
      if (!res || !res.success) throw new Error(res?.message || 'Failed to load community animations.');

      publishedFeed = res.data || [];
      if (countBadge) countBadge.textContent = publishedFeed.length;
      renderPublishedGrid();
    } catch (err) {
      console.error('Error loading published feed:', err);
      if (grid) {
        grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <b>Could not load community animations</b>
            <p>${escapeHtml(err.message || 'Please check your connection and try again.')}</p>
            <button class="primary small-btn" style="margin-top: 14px;" onclick="window.loadPublishedFeed && window.loadPublishedFeed()">Try Again</button>
          </div>
        `;
      }
    }
  }

  window.loadPublishedFeed = loadPublishedFeed;

  function renderPublishedGrid() {
    const grid = document.getElementById('exploreGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const currentUser = window.getUser();

    if (!publishedFeed.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✨</div>
          <b>No community animations found</b>
          <p>${exploreSearchQuery ? `No creations matching "<em>${escapeHtml(exploreSearchQuery)}</em>"` : 'Be the first creator to publish! Open any project in My Studio and select "Publish to Community".'}</p>
        </div>
      `;
      return;
    }

    publishedFeed.forEach(item => {
      const card = document.createElement('article');
      card.className = 'video-card';

      const date = new Date(item.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const isAuthor = currentUser && (
        String(currentUser.id) === String(item.user_id) ||
        currentUser.username === item.author_name
      );

      const authorInitial = getInitials(item.author_name, '');
      const authorColor = getAvatarColor(item.author_name);

      card.innerHTML = `
        <div class="video-preview-wrap">
          <video src="${item.video_data}" controls loop playsinline preload="metadata" poster="${item.thumbnail || ''}" title="${escapeHtml(item.title)}"></video>
          <div class="video-meta-chip">
            <span class="mono">${item.fps || 12} FPS</span>
            <span>·</span>
            <span class="mono">${item.frame_count || 1} frames</span>
          </div>
        </div>

        <div class="video-card-body">
          <div class="video-header-row">
            <h4 class="video-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h4>
            ${isAuthor ? `
              <button class="video-delete-btn" type="button" title="Remove your animation from community feed" aria-label="Delete">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            ` : ''}
          </div>

          ${item.description ? `<p class="video-description">${escapeHtml(item.description)}</p>` : ''}

          <div class="video-author-row">
            <div class="author-avatar" style="background-color: ${authorColor}">
              ${item.author_avatar ? `<img src="${item.author_avatar}" alt="${escapeHtml(item.author_name)}">` : `<span>${authorInitial}</span>`}
            </div>
            <div class="author-info">
              <span class="author-name">${escapeHtml(item.author_name || 'Anonymous')}</span>
              <span class="author-date">${date}</span>
            </div>
            <div class="video-stats">
              <button class="video-like-btn" type="button" title="Applaud animation">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span class="like-count mono">${item.likes_count || 0}</span>
              </button>
            </div>
          </div>

          <div class="video-actions-row">
            <button class="video-download-btn" type="button" title="Download video file to laptop">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              <span>Download Video</span>
            </button>
            <button class="video-remix-btn" type="button" title="Remix & edit this animation in Studio">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 4 6 6M3 21l3.5-1L18 8l-5-5L1.5 14.5 3 21Z"/><path d="m11 5 5 5"/></svg>
              <span>Remix & Edit</span>
            </button>
          </div>
        </div>
      `;

      // Download Video Handler
      card.querySelector('.video-download-btn').onclick = () => {
        toast('Downloading video...');
        const cleanName = (item.title || 'animation').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        window.VideoEngine.downloadVideoFile(item.video_data, `${cleanName}.webm`);
      };

      // Remix & Edit Handler
      card.querySelector('.video-remix-btn').onclick = async () => {
        await handleRemixAnimation(item);
      };

      // Like Handler
      const likeBtn = card.querySelector('.video-like-btn');
      likeBtn.onclick = async () => {
        likeBtn.disabled = true;
        try {
          const res = await window.apiFetch(`${PUBLISHED_API}/${item.id}/like`, { method: 'POST' });
          if (res?.success) {
            item.likes_count = res.likes_count;
            card.querySelector('.like-count').textContent = res.likes_count;
            likeBtn.classList.add('liked');
          }
        } catch (e) {
          console.error(e);
        } finally {
          likeBtn.disabled = false;
        }
      };

      // Delete/Unpublish Handler (for author)
      if (isAuthor) {
        card.querySelector('.video-delete-btn').onclick = async () => {
          const confirmed = await window.showConfirmDialog({
            title: 'Remove Published Animation',
            message: `Remove "${item.title}" from the public community feed?`,
            confirmText: 'Remove',
            cancelText: 'Cancel'
          });
          if (!confirmed) return;
          const res = await window.apiFetch(`${PUBLISHED_API}/${item.id}`, { method: 'DELETE' });
          if (res?.success) {
            toast('Animation removed from community.');
            await loadPublishedFeed();
          } else {
            toast(res?.message || 'Failed to remove animation.');
          }
        };
      }

      grid.appendChild(card);
    });
  }

  /**
   * Remix community animation directly into Studio
   */
  async function handleRemixAnimation(item) {
    const progressModal = showProgressModal('Remixing Animation', 'Preparing frames for Studio editor...');

    try {
      progressModal.update(0.2, 'Decoding video into frame-by-frame canvas...');

      // Convert data URL to Blob for VideoEngine extraction
      const res = await fetch(item.video_data);
      const blob = await res.blob();
      const file = new File([blob], `${item.title || 'remix'}.webm`, { type: 'video/webm' });

      const extracted = await window.VideoEngine.extractFramesFromVideo(
        file,
        item.fps || 12,
        (ratio) => {
          progressModal.update(0.2 + ratio * 0.65, `Extracted frame ${Math.round(ratio * 100)}%...`);
        }
      );

      progressModal.update(0.9, 'Creating new Studio workspace project...');

      const remixName = `Remix of ${item.title || 'Animation'}`;
      const createRes = await window.apiFetch(API, {
        method: 'POST',
        body: JSON.stringify({
          name: remixName,
          fps: extracted.fps || item.fps || 12,
          frames: extracted.frames
        })
      });

      if (!createRes || !createRes.success || !createRes.data) {
        throw new Error(createRes?.message || 'Failed to create remix project.');
      }

      progressModal.update(1.0, 'Remix ready!');
      setTimeout(async () => {
        progressModal.close();
        toast('🚀 Remix ready! You can now draw and modify every frame.');
        await openProject(createRes.data.id);
      }, 400);

    } catch (err) {
      console.error('Remix error:', err);
      progressModal.close();
      toast('Failed to remix: ' + (err.message || 'Unknown error'));
    }
  }

  /* ==========================================================================
     UPLOAD & EDIT VIDEO (Navbar Action)
     ========================================================================== */

  function setupUploadHandler() {
    const uploadBtn = document.getElementById('uploadVideoBtn');
    const fileInput = document.getElementById('videoUploadInput');

    if (!uploadBtn || !fileInput) return;

    uploadBtn.addEventListener('click', () => {
      fileInput.value = '';
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();

      // Case 1: Video file (.webm, .mp4, .ogg, .mov, etc.)
      if (file.type.startsWith('video/') || fileName.endsWith('.webm') || fileName.endsWith('.mp4') || fileName.endsWith('.ogg')) {
        await handleVideoUpload(file);
        return;
      }

      // Case 2: JSON animation export file
      if (file.type.includes('json') || fileName.endsWith('.json')) {
        await handleJsonUpload(file);
        return;
      }

      toast('Please upload a valid WebM/MP4 video or JSON animation file.');
    });
  }

  async function handleVideoUpload(file) {
    const progressModal = showProgressModal('Importing Video to Studio', 'Reading video file...');

    try {
      progressModal.update(0.1, 'Analyzing video metadata and frame timings...');

      const extracted = await window.VideoEngine.extractFramesFromVideo(
        file,
        12, // Default 12 FPS sampling
        (ratio) => {
          progressModal.update(0.15 + ratio * 0.7, `Decompiling video frames (${Math.round(ratio * 100)}%)...`);
        }
      );

      if (!extracted.frames || !extracted.frames.length) {
        throw new Error('No frames could be extracted from this video.');
      }

      progressModal.update(0.9, 'Creating animation project in Studio...');

      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Imported Video';
      const createRes = await window.apiFetch(API, {
        method: 'POST',
        body: JSON.stringify({
          name: cleanName,
          fps: extracted.fps || 12,
          frames: extracted.frames
        })
      });

      if (!createRes || !createRes.success || !createRes.data) {
        throw new Error(createRes?.message || 'Failed to create imported project.');
      }

      progressModal.update(1.0, 'Import complete!');
      setTimeout(async () => {
        progressModal.close();
        toast('🎬 Video successfully imported! Ready for frame-by-frame editing.');
        await openProject(createRes.data.id);
      }, 400);

    } catch (err) {
      console.error('Video upload error:', err);
      progressModal.close();
      toast('Failed to import video: ' + (err.message || 'Invalid or corrupted file.'));
    }
  }

  async function handleJsonUpload(file) {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const name = json.name || file.name.replace(/\.[^/.]+$/, '') || 'Imported Animation';
        const fps = json.fps || 12;
        const frames = Array.isArray(json.frames) ? json.frames : [];

        if (!frames.length) {
          toast('JSON file does not contain valid frame data.');
          return;
        }

        const createRes = await window.apiFetch(API, {
          method: 'POST',
          body: JSON.stringify({ name, fps, frames })
        });

        if (createRes?.success) {
          toast('JSON project imported successfully!');
          await openProject(createRes.data.id);
        } else {
          toast(createRes?.message || 'Failed to import JSON project.');
        }
      } catch (err) {
        console.error(err);
        toast('Failed to parse JSON animation file.');
      }
    };
    reader.readAsText(file);
  }

  /* ==========================================================================
     AVATAR & PROFILE MENU
     ========================================================================== */

  function getInitials(name, email) {
    if (name && name.trim().length > 0) {
      return name.trim().split(' ')[0].charAt(0).toUpperCase();
    } else if (email && email.trim().length > 0) {
      return email.trim().charAt(0).toUpperCase();
    }
    return 'U';
  }

  const AVATAR_COLORS = ['#5B3FD1', '#2563EB', '#16A34A', '#EA580C', '#9333EA', '#0D9488', '#DB2777', '#475569'];

  function getAvatarColor(name) {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  function updateAvatarUI(avatarUrl, username, email) {
    const tAvatar = document.getElementById('triggerAvatar');
    const dAvatar = document.getElementById('dropdownAvatar');
    let content = '';

    if (avatarUrl && avatarUrl.trim() !== '') {
      content = `<img src="${avatarUrl}" alt="Avatar">`;
      if (tAvatar) tAvatar.style.backgroundColor = 'transparent';
      if (dAvatar) dAvatar.style.backgroundColor = 'transparent';
    } else {
      const initial = getInitials(username, email);
      const seedStr = (username && username.trim()) ? username : email;
      const color = getAvatarColor(seedStr);
      content = `<span>${initial}</span>`;
      if (tAvatar) tAvatar.style.backgroundColor = color;
      if (dAvatar) dAvatar.style.backgroundColor = color;
    }

    if (tAvatar) tAvatar.innerHTML = content;
    if (dAvatar) dAvatar.innerHTML = content;
  }

  function setupProfileMenu() {
    const trigger = document.getElementById('profileTrigger');
    const dropdown = document.getElementById('profileDropdown');
    const changeBtn = document.getElementById('changePhotoBtn');
    const fileInput = document.getElementById('avatarInput');

    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = dropdown.classList.toggle('hidden');
      trigger.setAttribute('aria-expanded', String(!isHidden));
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
        dropdown.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
      }
      document.querySelectorAll('.project-menu:not(.hidden)').forEach(menu => {
        const wrap = menu.closest('.project-menu-wrap');
        if (!wrap || !wrap.contains(e.target)) {
          menu.classList.add('hidden');
          const t = wrap?.querySelector('.project-menu-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!dropdown.classList.contains('hidden')) {
          dropdown.classList.add('hidden');
          trigger.setAttribute('aria-expanded', 'false');
        }
        document.querySelectorAll('.project-menu:not(.hidden)').forEach(menu => {
          menu.classList.add('hidden');
          const t = menu.closest('.project-menu-wrap')?.querySelector('.project-menu-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      }
    });

    if (changeBtn && fileInput) {
      changeBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64Str = ev.target.result;
          const res = await window.apiFetch('/api/auth/avatar', {
            method: 'PUT',
            body: JSON.stringify({ avatar_url: base64Str })
          });

          if (res && res.success) {
            const user = window.getUser();
            user.avatar_url = base64Str;
            localStorage.setItem('omni_user', JSON.stringify(user));
            updateAvatarUI(base64Str, user.username, user.email);
            toast('Profile photo updated.');
          } else {
            toast(res ? res.message : 'Failed to update profile photo.');
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  /* ==========================================================================
     DOM CONTENT LOADED ATTACHMENT
     ========================================================================== */

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('dashboard')) return;

    const btnNewProject = document.getElementById('newProject');
    if (btnNewProject) btnNewProject.onclick = () => newProject();

    // Studio Search
    const projectSearch = document.getElementById('projectSearch');
    if (projectSearch) {
      projectSearch.addEventListener('input', (e) => {
        studioSearchQuery = e.target.value.trim();
        renderProjects();
      });
    }

    // Explore Community Search
    const exploreSearch = document.getElementById('exploreSearch');
    let searchDebounce = null;
    if (exploreSearch) {
      exploreSearch.addEventListener('input', (e) => {
        exploreSearchQuery = e.target.value.trim();
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
          loadPublishedFeed();
        }, 300);
      });
    }

    init();
  });
})();
