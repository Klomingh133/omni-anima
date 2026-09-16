// Global Page Transition & Studio Loader for OmniAnima
(function() {
  'use strict';

  let loaderStartedAt = Date.now();
  let currentMinDuration = 450;
  let hideTimer = null;
  let progressTimer = null;
  let progressValue = 0;
  let safetyTimeout = null;

  function getProgressBar() {
    let bar = document.getElementById('topProgressBar');
    if (!bar && document.body) {
      bar = document.createElement('div');
      bar.id = 'topProgressBar';
      bar.className = 'top-progress-bar';
      bar.setAttribute('aria-hidden', 'true');
      document.body.prepend(bar);
    }
    return bar;
  }

  function getAppLoader() {
    let loader = document.getElementById('appLoader');
    if (!loader && document.body) {
      loader = document.createElement('div');
      loader.id = 'appLoader';
      loader.className = 'app-loader is-hidden';
      loader.setAttribute('role', 'status');
      loader.setAttribute('aria-live', 'polite');
      loader.innerHTML = `
        <div class="loader-backdrop-glow" aria-hidden="true"></div>
        <div class="minimal-loader">
          <div class="infinity-stage" aria-hidden="true">
            <svg class="loader-svg" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="loaderStrokeGrad" x1="20" y1="45" x2="140" y2="45" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#3978ff"/>
                  <stop offset="50%" stop-color="#f59e0b"/>
                  <stop offset="100%" stop-color="#3978ff"/>
                </linearGradient>
              </defs>
              <path class="infinity-guide" d="M 80 45 C 64 24, 38 24, 38 45 C 38 66, 64 66, 80 45 C 96 24, 122 24, 122 45 C 122 66, 96 66, 80 45 Z"/>
              <path class="infinity-draw" d="M 80 45 C 64 24, 38 24, 38 45 C 38 66, 64 66, 80 45 C 96 24, 122 24, 122 45 C 122 66, 96 66, 80 45 Z"/>
              <g class="stylus-group">
                <circle cx="0" cy="0" r="2.5" class="pen-nib-sparkle"/>
                <path class="pen-tip" d="M 0 0 L -3.5 -2.5 L -4 -0.5 Z"/>
                <path class="pen-body" d="M -3.5 -2.5 L -15 -10.5 L -17 -8 L -4 -0.5 Z"/>
                <path class="pen-accent" d="M -9.5 -6.8 L -12.5 -8.8 L -14 -7 L -11 -5 Z"/>
              </g>
            </svg>
          </div>
          <div class="minimal-loader-caption">
            <span id="loaderCaptionText">Preparing canvas</span>
            <span class="dots-shimmer"><span>.</span><span>.</span><span>.</span></span>
          </div>
        </div>
      `;
      document.body.appendChild(loader);
    }
    return loader;
  }

  function setProgress(val) {
    const bar = getProgressBar();
    if (!bar) return;
    progressValue = Math.min(100, Math.max(0, val));
    bar.classList.add('is-active');
    bar.style.opacity = '1';
    bar.style.width = progressValue + '%';
  }

  function startProgress() {
    clearInterval(progressTimer);
    setProgress(25);
    progressTimer = setInterval(() => {
      if (progressValue < 85) {
        setProgress(progressValue + Math.max(1, (85 - progressValue) * 0.18));
      }
    }, 100);
  }

  function finishProgress() {
    clearInterval(progressTimer);
    setProgress(100);
    setTimeout(() => {
      const bar = getProgressBar();
      if (bar) {
        bar.style.opacity = '0';
        setTimeout(() => {
          bar.classList.remove('is-active');
          bar.style.width = '0%';
        }, 300);
      }
    }, 220);
  }

  window.showAppLoader = function(caption = 'Preparing canvas', minDuration = 450) {
    clearTimeout(hideTimer);
    clearTimeout(safetyTimeout);
    currentMinDuration = minDuration;
    loaderStartedAt = Date.now();

    const loader = getAppLoader();
    if (loader) {
      loader.style.display = 'grid';
      delete loader.dataset.hidden;
      const captionEl = loader.querySelector('#loaderCaptionText') || loader.querySelector('.minimal-loader-caption span:first-child');
      if (captionEl) captionEl.textContent = caption;
      // Force reflow so transition applies when unhiding
      void loader.offsetWidth;
      loader.classList.remove('is-hidden');
    }

    startProgress();

    // Absolute safety timeout: never hang more than 8 seconds
    safetyTimeout = setTimeout(() => {
      window.hideAppLoader(true);
    }, 8000);
  };

  window.hideAppLoader = function(immediate = false) {
    clearTimeout(hideTimer);
    clearTimeout(safetyTimeout);
    finishProgress();

    const loader = getAppLoader();
    if (!loader) return;

    const elapsed = Date.now() - loaderStartedAt;
    const wait = immediate ? 0 : Math.max(60, currentMinDuration - elapsed);

    hideTimer = setTimeout(() => {
      loader.dataset.hidden = 'true';
      loader.classList.add('is-hidden');
      setTimeout(() => {
        if (loader.classList.contains('is-hidden')) {
          loader.style.display = 'none';
        }
      }, immediate ? 0 : 360);
    }, wait);
  };

  window.navigateWithLoader = function(url, caption = 'Opening Studio Workspace...') {
    window.showAppLoader(caption, 400);
    setProgress(85);
    setTimeout(() => {
      window.location.href = url;
    }, 280);
  };

  // Back-Forward Cache (bfcache) handling: hide loader if restored from cache
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      window.hideAppLoader(true);
    }
  });

  // Automatically start top progress bar if #appLoader is currently visible on page load
  document.addEventListener('DOMContentLoaded', () => {
    const initialLoader = document.getElementById('appLoader');
    if (initialLoader && !initialLoader.classList.contains('is-hidden')) {
      startProgress();
    }
  });
})();
