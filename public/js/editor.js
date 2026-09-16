window.EditorModule = (function() {
  'use strict';

  const W = 960, H = 540;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  // State
  let project = null;
  let current = 0;
  let toolName = 'pencil';
  let color = '#17202a';
  let size = 8;
  let opacity = 1;
  let undoHistory = [];
  let redoStack = [];
  let playTimer = null;
  let playIndex = 0;
  let zoom = 1;
  let activeTool = null;
  let renderQueued = false;

  // Canvas references
  let drawCanvas, onionCanvas, displayCanvas, ctx, octx, dctx;

  // Palette
  const palette = ['#17202a','#ffffff','#ff5c68','#ff9f43','#ffd43b','#55c878','#22b8cf','#3978ff','#9b5de5'];

  function normalizeLegacyBlankFrame(src) {
    if (typeof src !== 'string') return blank();
    if (!src.startsWith('data:image')) return blank();
    if (/fill=["']?#?(ffd43b|ffd95a|f5d70a|ffdc2e|f7d53b)|yellow/i.test(src)) {
      return blank();
    }
    return src;
  }

  function open(proj) {
    project = proj;
    current = 0;
    undoHistory = [];
    redoStack = [];

    drawCanvas = $('#drawCanvas');
    onionCanvas = $('#onionCanvas');
    displayCanvas = $('#displayCanvas');
    ctx = drawCanvas.getContext('2d', { willReadFrequently: true });
    octx = onionCanvas.getContext('2d');
    dctx = displayCanvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;

    if (!Array.isArray(project.frames) || !project.frames.length) {
      project.frames = [{ image_data: blank() }];
    } else {
      project.frames = project.frames.map((frame) => {
        const src = typeof frame === 'object' ? frame.image_data || frame : frame;
        return { ...frame, image_data: normalizeLegacyBlankFrame(src) };
      });
    }

    $('#docTitle').textContent = project.name;
    const fpsSelect = $('#fps');
    if (fpsSelect) {
      const currentFps = String(project.fps || 12);
      const exists = [...fpsSelect.options].some(opt => opt.value === currentFps);
      if (!exists) {
        const opt = new Option(currentFps, currentFps, true, true);
        fpsSelect.add(opt);
      }
      fpsSelect.value = currentFps;
    }

    setupEvents();
    setupSwatches();
    setTool('pencil');
    setColor(color);

    if (window.AutoSave) {
      window.AutoSave.init(project.id);
    }

    loadFrame(0);
  }

  function setupEvents() {
    const rebind = (sel) => {
      const el = $(sel);
      if (!el) return null;
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      return clone;
    };

    const dc = rebind('#drawCanvas');
    if (dc) {
      dc.addEventListener('pointerdown', beginDraw);
      dc.addEventListener('pointermove', moveDraw);
      dc.addEventListener('pointerup', endDraw);
      dc.addEventListener('pointercancel', endDraw);
      drawCanvas = dc;
      ctx = drawCanvas.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = true;
    }

    onionCanvas = $('#onionCanvas');
    octx = onionCanvas.getContext('2d');
    displayCanvas = $('#displayCanvas');
    dctx = displayCanvas.getContext('2d', { willReadFrequently: true });

    $$('.tool[data-tool]').forEach(b => {
      b.onclick = () => setTool(b.dataset.tool);
    });

    const wheel = rebind('#wheel');
    if (wheel) {
      drawColorWheel(wheel.querySelector('#colorWheelCanvas'));
      wheel.addEventListener('pointerdown', (e) => { wheel.setPointerCapture(e.pointerId); colorFromWheel(e); });
      wheel.addEventListener('pointermove', (e) => { if(e.buttons > 0) colorFromWheel(e); });
    }

    const colorInput = rebind('#colorInput');
    if (colorInput) colorInput.addEventListener('input', e => setColor(e.target.value));

    const sizeRange = rebind('#sizeRange');
    if (sizeRange) sizeRange.addEventListener('input', e => {
      size = +e.target.value;
      if ($('#sizeValue')) $('#sizeValue').textContent = size + ' px';
      updateCursor();
    });

    const brushOpacity = rebind('#brushOpacity');
    if (brushOpacity) brushOpacity.addEventListener('input', e => {
      opacity = +e.target.value / 100;
      if ($('#opacityValue')) $('#opacityValue').textContent = e.target.value + '%';
    });

    ['onionEnabled', 'showPrev', 'showNext', 'onionOpacity', 'removeBg', 'bgTolerance', 'bgColor'].forEach(id => {
      const el = rebind('#' + id);
      if (el) el.addEventListener('input', () => {
        if (id === 'onionOpacity' && $('#onionValue')) $('#onionValue').textContent = el.value + '%';
        if (id === 'bgTolerance' && $('#bgValue')) $('#bgValue').textContent = el.value;
        if (id !== 'removeBg' && id !== 'bgTolerance' && id !== 'bgColor') updateOnion();
        scheduleRender();
      });
    });

    const addFrameBtn = rebind('#addFrame');
    if (addFrameBtn) addFrameBtn.addEventListener('click', addFrame);
    const duplicateFrameBtn = rebind('#duplicateFrame');
    if (duplicateFrameBtn) duplicateFrameBtn.addEventListener('click', duplicateFrame);
    const deleteFrameBtn = rebind('#deleteFrame');
    if (deleteFrameBtn) deleteFrameBtn.addEventListener('click', deleteFrame);
    const playBtn = rebind('#playBtn');
    if (playBtn) playBtn.addEventListener('click', play);

    const framesBox = $('#frames');
    if (framesBox) {
      framesBox.onwheel = (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          framesBox.scrollLeft += e.deltaY;
        }
      };
    }

    const backBtn = rebind('#backBtn');
    if (backBtn) backBtn.addEventListener('click', async () => {
      save();
      if (window.AutoSave && !await window.AutoSave.destroy()) {
        toast('Saving is still in progress. Please wait a moment.');
        return;
      }
      window.closeToDashboard();
    });

    const undoBtn = rebind('#undoBtn');
    if (undoBtn) undoBtn.addEventListener('click', performUndo);
    const redoBtn = rebind('#redoBtn');
    if (redoBtn) redoBtn.addEventListener('click', performRedo);

    const fpsInput = rebind('#fps');
    if (fpsInput) fpsInput.addEventListener('change', () => {
      let v = Math.max(1, Math.min(30, +fpsInput.value || 12));
      fpsInput.value = v;
      project.fps = v;
      if (window.AutoSave) window.AutoSave.saveProjectMeta({ fps: v });
    });

    const mirrorHBtn = rebind('#mirrorHBtn');
    if (mirrorHBtn) mirrorHBtn.addEventListener('click', mirrorH);
    const mirrorVBtn = rebind('#mirrorVBtn');
    if (mirrorVBtn) mirrorVBtn.addEventListener('click', mirrorV);

    const setInspectorOpen = (open) => {
      const insp = $('#inspector');
      const btn = $('#inspectorBtn');
      if (!insp) return;
      insp.classList.toggle('open', open);
      if (btn) {
        btn.classList.toggle('active', open);
        btn.setAttribute('aria-expanded', String(open));
      }
    };

    const inspectorBtn = rebind('#inspectorBtn');
    if (inspectorBtn) inspectorBtn.addEventListener('click', () => {
      const isOpen = $('#inspector')?.classList.contains('open');
      setInspectorOpen(!isOpen);
    });
    const inspectorClose = rebind('#inspectorClose');
    if (inspectorClose) inspectorClose.addEventListener('click', () => setInspectorOpen(false));

    const exportGifBtn = rebind('#exportGifBtn');
    if (exportGifBtn) exportGifBtn.addEventListener('click', exportGif);
    const exportBtn = rebind('#exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportJson);
    const importBtn = rebind('#importBtn');
    const importFile = rebind('#importFile');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => {
        if (e.target.files[0]) importJson(e.target.files[0]);
        e.target.value = '';
      });
    }

    const zoomInBtn = rebind('#zoomIn');
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => setZoom(zoom + 0.25));
    const zoomOutBtn = rebind('#zoomOut');
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => setZoom(zoom - 0.25));
    const zoomResetBtn = rebind('#zoomReset');
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => setZoom(1));

    document.removeEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', updateCachedRect);
    window.addEventListener('resize', updateCachedRect);
  }

  function updateCursor() {
    if (!drawCanvas) return;
    if (toolName !== 'pencil' && toolName !== 'eraser' && toolName !== 'brush') {
      if (activeTool) drawCanvas.style.cursor = activeTool.cursor;
      return;
    }
    
    const d = size * zoom;
    const stroke = toolName === 'eraser' ? '#ff5c68' : '#17202a';
    const minSize = Math.max(16, Math.ceil(d) + 4);
    const center = minSize / 2;
    const r = Math.max(1, d / 2);
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${minSize}" height="${minSize}">
      <circle cx="${center}" cy="${center}" r="${r}" stroke="${stroke}" stroke-width="1.5" fill="none" />
      <circle cx="${center}" cy="${center}" r="1" fill="${stroke}" />
    </svg>`;
    
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    drawCanvas.style.cursor = `url('${dataUrl}') ${center} ${center}, crosshair`;
  }

  function handleKeyDown(e) {
    if (e.target.matches('input, textarea')) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ') { e.preventDefault(); performUndo(); return; }
    if (((e.ctrlKey || e.metaKey) && e.code === 'KeyY') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ')) { e.preventDefault(); performRedo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
      e.preventDefault(); save(); if (window.AutoSave) window.AutoSave.flush(); toast('Project saved'); return;
    }
    switch (e.code) {
      case 'Space': e.preventDefault(); play(); break;
      case 'KeyB': setTool('pencil'); break;
      case 'KeyE': setTool('eraser'); break;
      case 'KeyI': setTool('eyedropper'); break;
      case 'KeyT': setTool('text'); break;
      case 'KeyV': setTool('select'); break;
      case 'KeyN': addFrame(); break;
      case 'Delete': deleteFrame(); break;
    }
    if (e.key === '+' || e.key === '=') setZoom(zoom + 0.25);
    if (e.key === '-') setZoom(zoom - 0.25);
    if (e.key === '0') setZoom(1);
  }

  function blank() {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, W, H);
    return c.toDataURL('image/png');
  }

  async function loadFrame(i) {
    if (i < 0 || i >= project.frames.length) return;
    current = i;
    if (window.persistEditorState) window.persistEditorState(project.id, current);
    const frame = project.frames[i];
    const imgSrc = frame.image_data || frame;
    const im = await loadImg(imgSrc);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(im, 0, 0, W, H);
    
    await updateOnion();
    renderFrames();
    updateButtons();
    scheduleRender();

    const activeFrameEl = $('#frames .frame.active');
    if (activeFrameEl) {
      activeFrameEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function loadImg(src) {
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => resolve(im);
      im.src = src;
    });
  }

  function getFrameData(i) {
    const f = project.frames[i];
    return f?.image_data || f;
  }

  let saveTimer = null;
  let isCurrentDirty = false;

  function commitCurrentFrame() {
    if (!drawCanvas || !project || !project.frames) return;
    const dataUrl = drawCanvas.toDataURL('image/png');
    if (project.frames[current]) {
      if (typeof project.frames[current] === 'object') project.frames[current].image_data = dataUrl;
      else project.frames[current] = dataUrl;
    }
    project.fps = +$('#fps')?.value || 12;
    if (window.persistEditorState) window.persistEditorState(project.id, current);
    if (window.AutoSave) window.AutoSave.markDirty(current, dataUrl);

    // Update active frame thumbnail image directly without wiping DOM
    const activeThumb = $(`#frames .frame[data-index="${current}"] img`);
    if (activeThumb) activeThumb.src = dataUrl;

    isCurrentDirty = false;
  }

  function save(immediate = false) {
    isCurrentDirty = true;
    clearTimeout(saveTimer);
    if (immediate) {
      commitCurrentFrame();
    } else {
      saveTimer = setTimeout(commitCurrentFrame, 350);
    }
  }

  function pushUndo() {
    undoHistory.push({ i: current, data: getFrameData(current) });
    if (undoHistory.length > 45) undoHistory.shift();
    redoStack = [];
    updateButtons();
  }

  async function performUndo() {
    if (!undoHistory.length) return;
    const x = undoHistory.pop();
    redoStack.push({ i: x.i, data: drawCanvas.toDataURL('image/png') });
    setFrameData(x.i, x.data);
    if (current !== x.i) {
      await loadFrame(x.i);
    } else {
      const im = await loadImg(x.data);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(im, 0, 0, W, H);
      await updateOnion();
      scheduleRender();
      save();
      updateButtons();
    }
  }

  async function performRedo() {
    if (!redoStack.length) return;
    const x = redoStack.pop();
    undoHistory.push({ i: x.i, data: drawCanvas.toDataURL('image/png') });
    setFrameData(x.i, x.data);
    if (current !== x.i) {
      await loadFrame(x.i);
    } else {
      const im = await loadImg(x.data);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(im, 0, 0, W, H);
      await updateOnion();
      scheduleRender();
      save();
      updateButtons();
    }
  }

  function setFrameData(i, data) {
    if (typeof project.frames[i] === 'object') project.frames[i].image_data = data;
    else project.frames[i] = data;
  }

  async function updateOnion() {
    octx.clearRect(0, 0, W, H);
    const enabled = $('#onionEnabled');
    if (!enabled || !enabled.checked) return;
    if (project.frames.length < 2) return;

    const opInput = $('#onionOpacity');
    const alpha = opInput ? (+opInput.value / 100) : 0.35;
    const showPrev = $('#showPrev');
    const showNext = $('#showNext');

    if (showPrev && showPrev.checked && current > 0) {
      const prevSrc = getFrameData(current - 1);
      const im = await loadImg(prevSrc);
      octx.globalAlpha = alpha;
      octx.drawImage(im, 0, 0, W, H);
    }
    if (showNext && showNext.checked && current < project.frames.length - 1) {
      const nextSrc = getFrameData(current + 1);
      const im = await loadImg(nextSrc);
      octx.globalAlpha = alpha * 0.7;
      octx.drawImage(im, 0, 0, W, H);
    }
    octx.globalAlpha = 1;
  }

  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderDisplay();
    });
  }

  function hexToRgb(h) {
    if (!h || typeof h !== 'string') return { r: 255, g: 255, b: 255 };
    let x = h.replace('#', '');
    if (x.length === 3) x = x.split('').map(c => c+c).join('');
    if (x.length !== 6) return { r: 255, g: 255, b: 255 };
    const n = parseInt(x, 16);
    if (isNaN(n)) return { r: 255, g: 255, b: 255 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  // Temporary canvas for chroma key compositing
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = W; tmpCanvas.height = H;
  const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true });

  function renderDisplay() {
    dctx.clearRect(0, 0, W, H);
    
    // Always draw onion canvas first so it sits at the bottom of the composite
    if ($('#onionEnabled')?.checked) {
      dctx.drawImage(onionCanvas, 0, 0);
    }

    const removeBg = $('#removeBg')?.checked;
    if (!removeBg) {
      dctx.drawImage(drawCanvas, 0, 0);
      return;
    }

    // Chroma key (background removal) with squared distance optimization
    const s = ctx.getImageData(0, 0, W, H);
    const out = dctx.createImageData(W, H);
    
    const bgColorVal = $('#bgColor')?.value || '#ffffff';
    const bg = hexToRgb(bgColorVal);
    const tolInput = $('#bgTolerance');
    const tol = tolInput ? +tolInput.value : 18;
    const tolSq = tol * tol;
    const tolEdge = tol + 28;
    const tolEdgeSq = tolEdge * tolEdge;

    const sData = s.data;
    const outData = out.data;
    const len = sData.length;
    const bgR = bg.r, bgG = bg.g, bgB = bg.b;

    // Fast copy entire buffer first via 32-bit typed array view
    new Uint32Array(outData.buffer).set(new Uint32Array(sData.buffer));

    for (let i = 0; i < len; i += 4) {
      const alpha = sData[i + 3];
      if (alpha > 0) {
        const dr = sData[i] - bgR;
        const dg = sData[i + 1] - bgG;
        const db = sData[i + 2] - bgB;
        const distSq = dr * dr + dg * dg + db * db;
        if (distSq <= tolSq) {
          outData[i + 3] = 0;
        } else if (distSq < tolEdgeSq) {
          const dist = Math.sqrt(distSq);
          outData[i + 3] = Math.round(alpha * (dist - tol) / 28);
        }
      }
    }

    // Use a persistent temporary canvas to draw the transparent image over the existing dctx (onion)
    // using proper alpha blending, rather than putImageData which overwrites pixels entirely.
    tmpCtx.putImageData(out, 0, 0);
    dctx.drawImage(tmpCanvas, 0, 0);
  }

  let cachedRect = null;
  function updateCachedRect() {
    if (drawCanvas) cachedRect = drawCanvas.getBoundingClientRect();
  }

  function point(e) {
    if (!cachedRect) updateCachedRect();
    return {
      x: (e.clientX - cachedRect.left) * W / cachedRect.width,
      y: (e.clientY - cachedRect.top) * H / cachedRect.height
    };
  }

  function applyStrokeStyle() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size;
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = toolName === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
  }

  function beginDraw(e) {
    if (playTimer) return;
    updateCachedRect();
    const p = point(e);

    if (toolName === 'eyedropper') {
      const d = ctx.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
      setColor('#' + [d[0], d[1], d[2]].map(x => x.toString(16).padStart(2, '0')).join(''));
      setTool('pencil');
      return;
    }
    if (toolName === 'fill') {
      pushUndo();
      activeTool.begin(p, e, color);
      scheduleRender();
      save(true);
      return;
    }
    if (toolName === 'clear') {
      pushUndo();
      ctx.clearRect(0, 0, W, H);
      scheduleRender();
      save(true);
      setTool('pencil');
      return;
    }

    pushUndo();
    applyStrokeStyle();
    drawCanvas.setPointerCapture?.(e.pointerId);
    if (toolName === 'text') {
      activeTool.begin(p, e, () => {
        scheduleRender();
        save(true);
      });
      return;
    }
    activeTool.begin(p, e);
    scheduleRender();
  }

  function moveDraw(e) {
    if (!activeTool?.drawing) return;
    // applyStrokeStyle is already set on beginDraw and settings changes; avoid per-move redundant calls
    activeTool.move(point(e), e);
    scheduleRender();
  }

  function endDraw(e) {
    if (!activeTool?.drawing) return;
    activeTool.end(point(e), e);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    scheduleRender();
    // Use debounced save on stroke completion for instantaneous user response without UI freeze
    save(false);
  }

  function updateActiveFrameHighlight(index) {
    const box = $('#frames');
    if (!box) return;
    const prev = box.querySelector('.frame.active');
    if (prev) prev.classList.remove('active');
    const curr = box.querySelector(`.frame[data-index="${index}"]`);
    if (curr) {
      curr.classList.add('active');
      curr.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    }
  }

  function renderFrames() {
    const box = $('#frames');
    if (!box) return;
    box.innerHTML = '';
    project.frames.forEach((frame, i) => {
      const btn = document.createElement('button');
      btn.className = 'frame' + (i === current ? ' active' : '');
      btn.dataset.index = String(i);
      const src = frame.image_data || frame;
      btn.innerHTML = `<img src="${src}" alt="Frame ${i + 1}"><span class="mono">${i + 1}</span>`;
      btn.onclick = () => {
        if (activeTool?.drawing) return;
        save(true);
        loadFrame(i);
      };
      btn.draggable = true;
      btn.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', String(i)));
      btn.addEventListener('dragover', (e) => e.preventDefault());
      btn.addEventListener('drop', async (e) => {
        e.preventDefault();
        const from = parseInt(e.dataTransfer.getData('text/plain'));
        if (from === i) return;
        save();
        try {
          const result = await window.apiFetch('/api/projects/' + project.id + '/frames/reorder', {
            method: 'PUT',
            body: JSON.stringify({ old_index: from, new_index: i })
          });
          if (!result?.success) throw new Error('Urutan frame tidak tersimpan');
          const [moved] = project.frames.splice(from, 1);
          project.frames.splice(i, 0, moved);
          await loadFrame(i);
        } catch (err) {
          toast('Failed to reorder frame.');
        }
      });
      box.appendChild(btn);
    });
  }

  async function addFrame() {
    save();
    const newFrame = blank();
    const targetIndex = project.frames.length;
    try {
      const result = await window.apiFetch('/api/projects/' + project.id + '/frames', {
        method: 'POST',
        body: JSON.stringify({ frame_index: targetIndex, image_data: newFrame })
      });
      if (!result?.success) throw new Error('Frame not added');
      project.frames.push({ image_data: newFrame, frame_index: targetIndex });
      await loadFrame(targetIndex);
    } catch (err) {
      toast('Failed to add frame.');
    }
  }

  async function duplicateFrame() {
    save();
    const srcData = getFrameData(current);
    try {
      const result = await window.apiFetch('/api/projects/' + project.id + '/duplicate-frame', {
        method: 'POST',
        body: JSON.stringify({ frame_index: current })
      });
      if (!result?.success) throw new Error('Frame not duplicated');
      project.frames.splice(current + 1, 0, { image_data: srcData, frame_index: current + 1 });
      await loadFrame(current + 1);
    } catch (err) {
      toast('Failed to duplicate frame.');
    }
  }

  async function deleteFrame() {
    if (project.frames.length < 2) return;
    try {
      const result = await window.apiFetch('/api/projects/' + project.id + '/frames/' + current, {
        method: 'DELETE'
      });
      if (!result?.success) throw new Error('Frame not deleted');
      project.frames.splice(current, 1);
      await loadFrame(Math.min(current, project.frames.length - 1));
    } catch (err) {
      toast('Failed to delete frame.');
    }
  }

  function mirrorH() {
    pushUndo();
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    const tc = tmp.getContext('2d');
    tc.putImageData(ctx.getImageData(0, 0, W, H), 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
    scheduleRender();
    save();
  }

  function mirrorV() {
    pushUndo();
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    const tc = tmp.getContext('2d');
    tc.putImageData(ctx.getImageData(0, 0, W, H), 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(0, H);
    ctx.scale(1, -1);
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
    scheduleRender();
    save();
  }

  function stopPlayback() {
    clearInterval(playTimer);
    playTimer = null;
    const pb = $('#playBtn');
    if (pb) {
      pb.innerHTML = `<svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"/></svg><span>Play</span>`;
      pb.classList.remove('playing');
      pb.title = 'Play (Space)';
    }
    drawCanvas.style.pointerEvents = 'auto';
    loadFrame(current);
  }

  async function play() {
    if (playTimer) { stopPlayback(); return; }
    save(true);
    playIndex = 0;
    const pb = $('#playBtn');
    if (pb) {
      pb.innerHTML = `<svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="12" height="14" rx="1.5"/></svg><span>Stop</span>`;
      pb.classList.add('playing');
      pb.title = 'Stop (Space)';
    }
    drawCanvas.style.pointerEvents = 'none';

    const imgs = await Promise.all(
      project.frames.map((_, i) => loadImg(getFrameData(i)))
    );

    octx.clearRect(0, 0, W, H); // Hide onion during playback

    playTimer = setInterval(() => {
      const frame = imgs[playIndex];
      if (!frame) return;
      dctx.clearRect(0, 0, W, H);
      dctx.drawImage(frame, 0, 0, W, H);
      current = playIndex;
      updateActiveFrameHighlight(playIndex);
      playIndex = (playIndex + 1) % imgs.length;
    }, 1000 / (project.fps || 12));
  }

  function setTool(t) {
    toolName = t;
    $$('.tool').forEach(b => b.classList.toggle('active', b.dataset.tool === t));

    const toolMap = {
      pencil: window.Tools.PencilTool,
      brush: window.Tools.BrushTool,
      eraser: window.Tools.EraserTool,
      fill: window.Tools.FillTool,
      eyedropper: window.Tools.EyedropperTool,
      line: window.Tools.LineTool,
      rect: window.Tools.RectTool,
      ellipse: window.Tools.EllipseTool,
      text: window.Tools.TextTool,
      select: window.Tools.SelectTool
    };
    const ToolClass = toolMap[t] || window.Tools.PencilTool;
    activeTool = new ToolClass(ctx);
    updateCursor();
  }

  function setColor(v) {
    color = v;
    const cInput = $('#colorInput');
    if (cInput) cInput.value = v;
    const hexLabel = $('#colorHexLabel');
    if (hexLabel) hexLabel.textContent = (v || '').toUpperCase();
    $$('.swatch').forEach(x => x.classList.toggle('active', x.dataset.color === v));
    updateWheelDot(v);
  }

  function colorFromWheel(e) {
    const r = $('#wheel').getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    if (Math.hypot(x, y) > r.width / 2) return;
    const h = (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360;
    setColor(hslToHex(h));
    const dot = $('#wheelDot');
    if (dot) {
      dot.style.left = (50 + x / r.width * 100) + '%';
      dot.style.top = (50 + y / r.height * 100) + '%';
    }
  }

  function updateWheelDot(hex) {
    const dot = $('#wheelDot');
    if (!dot || !/^#[0-9a-f]{6}$/i.test(hex)) return;
    const { r, g, b } = hexToRgb(hex);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const delta = max - min;
    const saturation = max === 0 ? 0 : delta / max;
    let hue = 0;
    if (delta) {
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue *= 60;
      if (hue < 0) hue += 360;
    }
    const angle = (hue - 90) * Math.PI / 180;
    const radius = saturation * 42;
    dot.style.left = (50 + Math.cos(angle) * radius) + '%';
    dot.style.top = (50 + Math.sin(angle) * radius) + '%';
  }

  function drawColorWheel(canvas) {
    if (!canvas) return;
    const wheelCtx = canvas.getContext('2d');
    const width = canvas.width;
    const center = width / 2;
    const pixels = wheelCtx.createImageData(width, width);
    for (let y = 0; y < width; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - center;
        const dy = y - center;
        const distance = Math.hypot(dx, dy);
        const offset = (y * width + x) * 4;
        if (distance > center) continue;
        const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
        const saturation = Math.min(1, distance / center);
        const rgb = hslToRgb(hue, saturation, 0.56);
        pixels.data[offset] = rgb.r;
        pixels.data[offset + 1] = rgb.g;
        pixels.data[offset + 2] = rgb.b;
        pixels.data[offset + 3] = 255;
      }
    }
    wheelCtx.putImageData(pixels, 0, 0);
  }

  function hslToRgb(h, s, l) {
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const segment = h / 60;
    const x = chroma * (1 - Math.abs(segment % 2 - 1));
    let r = 0, g = 0, b = 0;
    if (segment < 1) [r, g] = [chroma, x];
    else if (segment < 2) [r, g] = [x, chroma];
    else if (segment < 3) [g, b] = [chroma, x];
    else if (segment < 4) [g, b] = [x, chroma];
    else if (segment < 5) [r, b] = [x, chroma];
    else [r, b] = [chroma, x];
    const match = l - chroma / 2;
    return { r: Math.round((r + match) * 255), g: Math.round((g + match) * 255), b: Math.round((b + match) * 255) };
  }

  function hslToHex(h) {
    const f = n => {
      const k = (n + h / 30) % 12;
      return 0.5 - 0.35 * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return '#' + [f(0), f(8), f(4)].map(v => Math.round(255 * v).toString(16).padStart(2, '0')).join('');
  }

  function updateButtons() {
    const del = $('#deleteFrame');
    if (del) del.disabled = project.frames.length < 2;
    const u = $('#undoBtn');
    if (u) u.disabled = !undoHistory.length;
    const r = $('#redoBtn');
    if (r) r.disabled = !redoStack.length;
  }

  async function exportGif() {
    if (typeof GIF === 'undefined') { toast('GIF export library not loaded. Please refresh the page.'); return; }
    const gif = new GIF({
      workers: 2, quality: 10, width: W, height: H,
      workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
    });
    const delay = 1000 / (project.fps || 12);
    for (let i = 0; i < project.frames.length; i++) {
      const img = await loadImg(getFrameData(i));
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      c.getContext('2d').drawImage(img, 0, 0);
      gif.addFrame(c, { delay });
    }
    gif.on('finished', blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = project.name.replace(/\W+/g, '-') + '.gif';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 0);
      toast('GIF downloaded successfully!');
    });
    toast('Generating GIF animation...');
    gif.render();
  }

  function exportJson() {
    save();
    const data = { name: project.name, fps: project.fps, frames: project.frames.map((_, i) => getFrameData(i)) };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = project.name.replace(/\W+/g, '-') + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
    toast('JSON project exported!');
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const p = JSON.parse(reader.result);
        if (!Array.isArray(p.frames) || !p.frames.length || !p.frames.every(frame => typeof frame === 'string' && frame.startsWith('data:image/'))) throw new Error('Invalid frame data format');
        toast('Importing project...');
        const res = await window.apiFetch('/api/projects', { method: 'POST', body: JSON.stringify({ name: p.name || 'Imported Animation' }) });
        if (!res?.success) throw 0;
        const newId = res.data.id;
        const fps = Math.max(1, Math.min(30, Number(p.fps) || 12));
        const fpsResult = await window.apiFetch('/api/projects/' + newId, { method: 'PUT', body: JSON.stringify({ fps }) });
        if (!fpsResult?.success) throw new Error('Failed to save FPS');
        for (let i = 0; i < p.frames.length; i++) {
          const frameResult = i === 0
            ? await window.apiFetch('/api/projects/' + newId + '/frames/0', { method: 'PUT', body: JSON.stringify({ image_data: p.frames[i] }) })
            : await window.apiFetch('/api/projects/' + newId + '/frames', { method: 'POST', body: JSON.stringify({ frame_index: i, image_data: p.frames[i] }) });
          if (!frameResult?.success) throw new Error('Frame failed to import');
        }
        toast('Project imported successfully!');
        window.closeToDashboard();
      } catch { toast('Failed to import file.'); }
    };
    reader.readAsText(file);
  }

  function setZoom(z) {
    zoom = Math.max(0.25, Math.min(3, z));
    const wrap = $('.canvas-wrap');
    if (wrap) {
      wrap.style.transform = `scale(${zoom})`;
      wrap.style.transformOrigin = 'center center';
    }
    const zv = $('#zoomValue');
    if (zv) zv.textContent = Math.round(zoom * 100) + '%';
    updateCursor();
  }

  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2000);
  }

  function setupSwatches() {
    const container = $('#swatches');
    if (!container) return;
    container.innerHTML = '';
    palette.forEach(c => {
      const b = document.createElement('button');
      b.className = 'swatch';
      b.dataset.color = c;
      b.style.background = c;
      b.onclick = () => setColor(c);
      container.appendChild(b);
    });
  }

  function setCurrentFrame(i) {
    if (Number.isInteger(i) && i >= 0 && i < project.frames.length) {
      loadFrame(i);
    }
  }

  window.showToast = toast;

  return { open, setTool, setColor, toast, setCurrentFrame };
})();
