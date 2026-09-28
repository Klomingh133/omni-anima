// AutoSave module for OmniAnima
window.AutoSave = (function() {
  'use strict';

  const DEBOUNCE_MS = 3000; // 3 seconds after last change
  let projectId = null;
  let timer = null;
  let queue = []; // queue of { frameIndex, imageData } to save
  let saving = false;
  let indicator = null;

  function init(pid) {
    projectId = pid;
    indicator = document.getElementById('saveIndicator');
    // Listen for beforeunload to save immediately
    window.addEventListener('pagehide', flushSync);
    showStatus('saved');
  }

  function markDirty(frameIndex, imageData) {
    // Add to queue (replace if same frameIndex already queued)
    const existing = queue.findIndex(q => q.frameIndex === frameIndex);
    if (existing >= 0) queue[existing].imageData = imageData;
    else queue.push({ frameIndex, imageData });
    
    // Debounce
    clearTimeout(timer);
    showStatus('saving');
    timer = setTimeout(flush, DEBOUNCE_MS);
  }

  async function flush() {
    if (saving || !queue.length || !projectId) {
       if(!queue.length && indicator && indicator.classList.contains('saving')) {
           showStatus('saved');
       }
       return;
    }
    saving = true;
    showStatus('saving');
    
    while (queue.length) {
      const item = queue.shift();
      try {
        const result = await window.apiFetch('/api/projects/' + projectId + '/frames/' + item.frameIndex, {
          method: 'PUT',
          body: JSON.stringify({ image_data: item.imageData })
        });
        if (!result?.success) throw new Error('Frame failed to save');
      } catch (err) {
        // Put back in queue and retry later
        queue.unshift(item);
        showStatus('error');
        saving = false;
        timer = setTimeout(flush, 5000); // retry in 5s
        return;
      }
    }
    
    saving = false;
    showStatus('saved');
  }

  function flushSync() {
    // Keep the same authenticated PUT contract when the page is being closed.
    if (!queue.length || !projectId) return;
    const token = localStorage.getItem('omni_token') || localStorage.getItem('sketsa_token');
    queue.forEach(item => {
      const url = '/api/projects/' + projectId + '/frames/' + item.frameIndex;
      const data = JSON.stringify({ image_data: item.imageData });
      if (token) {
        fetch(url, {
          method: 'PUT',
          keepalive: true,
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: data
        }).catch(() => {});
      }
    });
    queue = [];
  }

  function saveNow(frameIndex, imageData) {
    // Immediate save (used when switching frames, etc.)
    markDirty(frameIndex, imageData);
    clearTimeout(timer);
    flush();
  }

  function showStatus(status) {
    if (!indicator) return;
    indicator.className = 'save-indicator ' + status;
    indicator.textContent = {
      saving: 'Saving...',
      saved: 'Saved',
      error: 'Failed to save'
    }[status] || '';
    
    if (status === 'saved') {
      setTimeout(() => {
        if (indicator && indicator.classList.contains('saved')) {
          indicator.style.opacity = '0.5';
        }
      }, 2000);
    } else {
      indicator.style.opacity = '1';
    }
  }

  async function saveProjectMeta(data) {
    if (!projectId) return;
    showStatus('saving');
    try {
      const result = await window.apiFetch('/api/projects/' + projectId, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      if (!result?.success) throw new Error('Project failed to save');
      showStatus('saved');
    } catch(err) {
      showStatus('error');
    }
  }

  async function destroy() {
    clearTimeout(timer);
    window.removeEventListener('pagehide', flushSync);
    while (saving) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    await flush(); // Final flush before clearing the project context.
    if (queue.length) {
      showStatus('error');
      return false;
    }
    projectId = null;
    queue = [];
    return true;
  }

  return { init, markDirty, saveNow, flush, saveProjectMeta, destroy };
})();
