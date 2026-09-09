/**
 * Diagram & Image Lens Pro - Content Script
 * High-Precision Magnifier, Deep-Zoom Lightbox, & Snipping Suite
 */

(function () {
  if (window.__DIAGRAM_LENS_INITIALIZED__) return;
  window.__DIAGRAM_LENS_INITIALIZED__ = true;

  // =========================================================================
  // State & Settings
  // =========================================================================
  const state = {
    enabled: true,
    zoomLevel: 3,
    lensShape: 'circle', // 'circle' | 'square'
    lensSize: 200,       // px
    showToolbar: true,
    currentTarget: null,
    targetType: null,    // 'img' | 'svg' | 'canvas' | 'bg'
    targetSrc: null,
    isModalOpen: false,
    isSnipActive: false,
    modal: {
      scale: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      flipH: 1,
      flipV: 1,
      filter: 'none', // 'none' | 'invert' | 'grayscale' | 'contrast'
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    },
    snip: {
      isSelecting: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      boxRect: null
    }
  };

  // Load preferences from chrome.storage
  chrome.storage.local.get(['magnifierEnabled', 'zoomLevel', 'lensShape', 'lensSize', 'showToolbar'], (res) => {
    if (res.magnifierEnabled !== undefined) state.enabled = res.magnifierEnabled;
    if (res.zoomLevel !== undefined) state.zoomLevel = Number(res.zoomLevel);
    if (res.lensShape !== undefined) state.lensShape = res.lensShape;
    if (res.lensSize !== undefined) state.lensSize = Number(res.lensSize);
    if (res.showToolbar !== undefined) state.showToolbar = res.showToolbar;
    updateLoupeStyle();
  });

  // Listen for storage updates
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.magnifierEnabled) state.enabled = changes.magnifierEnabled.newValue;
    if (changes.zoomLevel) state.zoomLevel = Number(changes.zoomLevel.newValue);
    if (changes.lensShape) state.lensShape = changes.lensShape.newValue;
    if (changes.lensSize) state.lensSize = Number(changes.lensSize.newValue);
    if (changes.showToolbar) state.showToolbar = changes.showToolbar.newValue;
    updateLoupeStyle();
  });

  // =========================================================================
  // DOM Elements Injection
  // =========================================================================

  // 1. Hover Loupe
  const loupe = document.createElement('div');
  loupe.id = 'diagram-lens-loupe';
  loupe.className = 'dl-shape-circle';
  const loupeBadge = document.createElement('span');
  loupeBadge.className = 'dl-badge';
  loupeBadge.textContent = `${state.zoomLevel}x`;
  loupe.appendChild(loupeBadge);
  document.body.appendChild(loupe);

  // 2. Floating Quick Action Toolbar
  const toolbar = document.createElement('div');
  toolbar.id = 'diagram-lens-toolbar';
  toolbar.innerHTML = `
    <button class="dl-tb-btn dl-tb-btn-primary" id="dl-tb-zoom" title="Open Deep-Zoom Lightbox (Z)">
      <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2z"/></svg>
      Deep Zoom
    </button>
    <button class="dl-tb-btn" id="dl-tb-copy" title="Copy Image to Clipboard as PNG">
      <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
      Copy
    </button>
    <button class="dl-tb-btn" id="dl-tb-snap" title="Take Element Screenshot">
      <svg viewBox="0 0 24 24"><path d="M9.4 10.5l4.77-8.26C13.47 2.09 12.75 2 12 2c-2.4 0-4.6.85-6.32 2.25l3.66 6.35.06-.1zM21.54 9c-.92-2.92-3.15-5.26-6-6.34L11.88 9h9.66zm.26 1.34l-4.77 8.27.06.1c.71.16 1.45.29 2.21.29 2.4 0 4.6-.85 6.32-2.25l-3.82-6.41zM2.46 15c.92 2.92 3.15 5.26 6 6.34L12.12 15H2.46zm-.26-1.34l4.77-8.27-.06-.1C6.2 5.13 5.46 5 4.7 5c-2.4 0-4.6.85-6.32 2.25l3.82 6.41z"/></svg>
      Snap
    </button>
    <button class="dl-tb-btn" id="dl-tb-save" title="Save / Download Image">
      <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
    </button>
  `;
  document.body.appendChild(toolbar);

  // 3. Deep Zoom Blueprint Lightbox Modal
  const modal = document.createElement('div');
  modal.id = 'diagram-lens-modal';
  modal.innerHTML = `
    <div class="dl-modal-header">
      <div class="dl-modal-title-group">
        <span class="dl-brand-pill">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2z"/></svg>
          Diagram & Image Lens Pro
        </span>
        <span class="dl-modal-meta" id="dl-meta-info">100% · 0 × 0 px</span>
      </div>

      <div class="dl-modal-controls">
        <button class="dl-ctrl-btn" id="dl-m-zoom-out" title="Zoom Out (-)">
          <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
        </button>
        <span class="dl-zoom-val" id="dl-m-zoom-display">100%</span>
        <button class="dl-ctrl-btn" id="dl-m-zoom-in" title="Zoom In (+)">
          <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
        <button class="dl-ctrl-btn" id="dl-m-zoom-reset" title="Reset View (0)">
          <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
        </button>

        <span class="dl-ctrl-separator"></span>

        <button class="dl-ctrl-btn" id="dl-m-rotate" title="Rotate 90° Clockwise (R)">
          <svg viewBox="0 0 24 24"><path d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.88-1.6-1.01-2.47zm1.02 5.35l-1.42 1.42c1.16.9 2.51 1.46 3.9 1.63v-2.02c-.87-.14-1.72-.49-2.48-1.03zM13 4.07V1L8.45 5.55 13 10V6.09c3.37 0 6.09 2.72 6.09 6.09s-2.72 6.09-6.09 6.09c-1.38 0-2.66-.46-3.69-1.24l-1.45 1.45C9.28 19.54 11.04 20.27 13 20.27c4.48 0 8.09-3.61 8.09-8.09S17.48 4.07 13 4.07z"/></svg>
        </button>
        <button class="dl-ctrl-btn" id="dl-m-fliph" title="Flip Horizontal">
          <svg viewBox="0 0 24 24"><path d="M15 21h2v-2h-2v2zm4-12h2V7h-2v2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2zm16-2v2h2c0-1.1-.9-2-2-2zm-8 20h2V1h-2v22zm8-6h2v-2h-2v2zM15 5h2V3h-2v2zm4 8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2z"/></svg>
        </button>

        <span class="dl-ctrl-separator"></span>

        <button class="dl-ctrl-btn" id="dl-m-invert" title="Invert Colors (Engineering Schematic Mode - I)">
          <svg viewBox="0 0 24 24"><path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0-18c4.42 0 8 3.58 8 8s-3.58 8-8 8V4z"/></svg>
        </button>
        <button class="dl-ctrl-btn" id="dl-m-contrast" title="High Contrast Mode">
          <svg viewBox="0 0 24 24"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18V6c3.31 0 6 2.69 6 6s-2.69 6-6 6z"/></svg>
        </button>
      </div>

      <div class="dl-modal-actions">
        <button class="dl-act-btn" id="dl-m-copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          Copy PNG
        </button>
        <button class="dl-act-btn" id="dl-m-save">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          Save
        </button>
        <button class="dl-act-btn dl-act-btn-close" id="dl-m-close" title="Close Lightbox (Esc)">
          ✕
        </button>
      </div>
    </div>

    <div class="dl-modal-viewport" id="dl-viewport">
      <div class="dl-modal-stage" id="dl-stage"></div>
    </div>

    <div class="dl-modal-footer">
      <span>Drag to <kbd>Pan</kbd></span>
      <span>Scroll to <kbd>Zoom</kbd></span>
      <span>Rotate: <kbd>R</kbd></span>
      <span>Invert: <kbd>I</kbd></span>
      <span>Copy: <kbd>C</kbd></span>
      <span>Reset: <kbd>0</kbd></span>
      <span>Close: <kbd>Esc</kbd></span>
    </div>
  `;
  document.body.appendChild(modal);

  // 4. Area Snipping Tool Overlay
  const snipOverlay = document.createElement('div');
  snipOverlay.id = 'diagram-lens-snip-overlay';
  snipOverlay.innerHTML = `
    <div id="diagram-lens-snip-box">
      <div id="diagram-lens-snip-pill">0 × 0 px</div>
      <div id="diagram-lens-snip-actions">
        <button class="dl-tb-btn dl-tb-btn-primary" id="dl-snip-copy">
          <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          Copy PNG
        </button>
        <button class="dl-tb-btn" id="dl-snip-download">
          <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          Download
        </button>
        <button class="dl-tb-btn" id="dl-snip-deepzoom">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2z"/></svg>
          Deep Zoom
        </button>
        <button class="dl-tb-btn" id="dl-snip-cancel" style="color: var(--dl-danger)">
          ✕ Cancel
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(snipOverlay);

  // 5. Toast Notification
  const toast = document.createElement('div');
  toast.id = 'diagram-lens-toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    <span id="dl-toast-msg">Notification</span>
  `;
  document.body.appendChild(toast);

  let toastTimer = null;
  function showToast(message, type = 'success') {
    const msgEl = document.getElementById('dl-toast-msg');
    if (msgEl) msgEl.textContent = message;
    toast.className = `dl-show dl-toast-${type}`;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.className = '';
    }, 3000);
  }

  // =========================================================================
  // Loupe Configuration & Positioning
  // =========================================================================
  function updateLoupeStyle() {
    loupe.style.width = `${state.lensSize}px`;
    loupe.style.height = `${state.lensSize}px`;
    loupe.className = state.lensShape === 'square' ? 'dl-shape-square' : 'dl-shape-circle';
    loupeBadge.textContent = `${state.zoomLevel}x`;
  }
  updateLoupeStyle();

  // Helper: Find target image, SVG, canvas, or background-image container
  function findEligibleVisualTarget(el) {
    if (!el || el === loupe || el === toolbar || modal.contains(el) || snipOverlay.contains(el)) {
      return null;
    }

    // 1. Direct Image
    if (el.tagName === 'IMG') {
      const rect = el.getBoundingClientRect();
      if (rect.width >= 32 && rect.height >= 32) {
        return { element: el, type: 'img', src: el.currentSrc || el.src };
      }
    }

    // 2. Direct or Closest SVG
    const svgEl = el.tagName === 'svg' ? el : el.closest('svg');
    if (svgEl) {
      const rect = svgEl.getBoundingClientRect();
      if (rect.width >= 32 && rect.height >= 32) {
        return { element: svgEl, type: 'svg', src: getSvgDataUri(svgEl) };
      }
    }

    // 3. Canvas Element
    const canvasEl = el.tagName === 'CANVAS' ? el : el.closest('canvas');
    if (canvasEl) {
      const rect = canvasEl.getBoundingClientRect();
      if (rect.width >= 32 && rect.height >= 32) {
        let src = '';
        try { src = canvasEl.toDataURL(); } catch (e) { /* tainted canvas */ }
        return { element: canvasEl, type: 'canvas', src: src };
      }
    }

    // 4. Background Image Container
    const computed = window.getComputedStyle(el);
    if (computed.backgroundImage && computed.backgroundImage !== 'none') {
      const match = computed.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
      if (match && match[1]) {
        const rect = el.getBoundingClientRect();
        if (rect.width >= 48 && rect.height >= 48) {
          return { element: el, type: 'bg', src: match[1] };
        }
      }
    }

    return null;
  }

  // Convert inline SVG to crisp scalable Data URI
  function getSvgDataUri(svgElement) {
    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);
      // Add xmlns if not present
      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
    } catch (e) {
      return '';
    }
  }

  // =========================================================================
  // Mouse & Hover Loupe Tracking
  // =========================================================================
  let toolbarHoverTimer = null;
  let isMouseOverToolbar = false;

  toolbar.addEventListener('mouseenter', () => { isMouseOverToolbar = true; });
  toolbar.addEventListener('mouseleave', () => {
    isMouseOverToolbar = false;
    hideToolbarGracefully();
  });

  function hideToolbarGracefully() {
    if (toolbarHoverTimer) clearTimeout(toolbarHoverTimer);
    toolbarHoverTimer = setTimeout(() => {
      if (!isMouseOverToolbar && !state.currentTarget) {
        toolbar.classList.remove('dl-active');
      }
    }, 250);
  }

  function positionToolbar(rect) {
    const margin = 8;
    let top = rect.top - 42;
    let left = rect.right - 240;

    // Boundary checks
    if (top < 10) top = rect.top + margin;
    if (left < 10) left = rect.left + margin;
    if (left + 240 > window.innerWidth) left = window.innerWidth - 250;

    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
    toolbar.classList.add('dl-active');
  }

  document.addEventListener('mousemove', (e) => {
    if (state.isModalOpen || state.isSnipActive) {
      loupe.classList.remove('dl-visible');
      return;
    }

    // Ignore if cursor is directly over toolbar or loupe
    if (toolbar.contains(e.target) || loupe.contains(e.target)) return;

    const targetInfo = findEligibleVisualTarget(e.target);

    if (targetInfo) {
      state.currentTarget = targetInfo.element;
      state.targetType = targetInfo.type;
      state.targetSrc = targetInfo.src;

      const rect = targetInfo.element.getBoundingClientRect();

      // Show & position Toolbar if enabled
      if (state.showToolbar) {
        positionToolbar(rect);
      }

      // Show & render Loupe if enabled
      if (state.enabled && targetInfo.src) {
        loupe.style.left = `${e.clientX}px`;
        loupe.style.top = `${e.clientY}px`;
        loupe.style.backgroundImage = `url("${targetInfo.src}")`;

        const zoom = state.zoomLevel;
        const bgW = rect.width * zoom;
        const bgH = rect.height * zoom;
        loupe.style.backgroundSize = `${bgW}px ${bgH}px`;

        const offsetX = (e.clientX - rect.left) * zoom - (state.lensSize / 2);
        const offsetY = (e.clientY - rect.top) * zoom - (state.lensSize / 2);
        loupe.style.backgroundPosition = `-${offsetX}px -${offsetY}px`;

        loupe.classList.add('dl-visible');
      } else {
        loupe.classList.remove('dl-visible');
      }
    } else {
      loupe.classList.remove('dl-visible');
      state.currentTarget = null;
      hideToolbarGracefully();
    }
  }, { passive: true });

  // Quick keyboard zoom adjust (+ / - keys while hovering)
  document.addEventListener('keydown', (e) => {
    if (state.isModalOpen) return;

    if (loupe.classList.contains('dl-visible')) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        state.zoomLevel = Math.min(16, state.zoomLevel + 1);
        loupeBadge.textContent = `${state.zoomLevel}x`;
        chrome.storage.local.set({ zoomLevel: state.zoomLevel });
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        state.zoomLevel = Math.max(2, state.zoomLevel - 1);
        loupeBadge.textContent = `${state.zoomLevel}x`;
        chrome.storage.local.set({ zoomLevel: state.zoomLevel });
      } else if (e.key.toLowerCase() === 'z' && state.currentTarget) {
        e.preventDefault();
        openDeepZoomModal(state.currentTarget, state.targetType, state.targetSrc);
      }
    }
  });

  // =========================================================================
  // Deep Zoom Blueprint Lightbox Modal Logic
  // =========================================================================
  const stage = document.getElementById('dl-stage');
  const viewport = document.getElementById('dl-viewport');
  const metaInfo = document.getElementById('dl-meta-info');
  const zoomDisplay = document.getElementById('dl-m-zoom-display');

  function openDeepZoomModal(element, type, src) {
    loupe.classList.remove('dl-visible');
    toolbar.classList.remove('dl-active');

    state.isModalOpen = true;
    modal.classList.add('dl-open');

    // Reset transform state
    state.modal.scale = 1;
    state.modal.panX = 0;
    state.modal.panY = 0;
    state.modal.rotation = 0;
    state.modal.flipH = 1;
    state.modal.flipV = 1;
    state.modal.filter = 'none';

    stage.innerHTML = '';
    stage.className = 'dl-modal-stage';

    let displayEl;
    if (type === 'svg' && element) {
      displayEl = element.cloneNode(true);
      displayEl.style.maxWidth = '85vw';
      displayEl.style.maxHeight = '75vh';
      displayEl.style.width = 'auto';
      displayEl.style.height = 'auto';
      stage.appendChild(displayEl);
      metaInfo.textContent = `SVG Vector Diagram · Scalable HD`;
    } else {
      displayEl = document.createElement('img');
      displayEl.src = src;
      displayEl.onload = () => {
        metaInfo.textContent = `${displayEl.naturalWidth} × ${displayEl.naturalHeight} px · 100%`;
      };
      displayEl.style.maxWidth = '85vw';
      displayEl.style.maxHeight = '75vh';
      stage.appendChild(displayEl);
      metaInfo.textContent = `Loading asset...`;
    }

    applyStageTransform();
  }

  function closeDeepZoomModal() {
    state.isModalOpen = false;
    modal.classList.remove('dl-open');
    stage.innerHTML = '';
  }

  function applyStageTransform() {
    const { scale, panX, panY, rotation, flipH, flipV } = state.modal;
    stage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale * flipH}, ${scale * flipV}) rotate(${rotation}deg)`;
    zoomDisplay.textContent = `${Math.round(scale * 100)}%`;
  }

  // Drag to Pan
  viewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('.dl-modal-controls') || e.target.closest('.dl-modal-actions')) return;
    state.modal.isDragging = true;
    state.modal.dragStartX = e.clientX - state.modal.panX;
    state.modal.dragStartY = e.clientY - state.modal.panY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.modal.isDragging) return;
    state.modal.panX = e.clientX - state.modal.dragStartX;
    state.modal.panY = e.clientY - state.modal.dragStartY;
    applyStageTransform();
  });

  window.addEventListener('mouseup', () => {
    state.modal.isDragging = false;
  });

  // Scroll Wheel to Zoom
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.min(10, Math.max(0.1, state.modal.scale * zoomFactor));
    state.modal.scale = newScale;
    applyStageTransform();
  }, { passive: false });

  // Modal Control Buttons
  document.getElementById('dl-m-zoom-in').addEventListener('click', () => {
    state.modal.scale = Math.min(10, state.modal.scale * 1.25);
    applyStageTransform();
  });

  document.getElementById('dl-m-zoom-out').addEventListener('click', () => {
    state.modal.scale = Math.max(0.1, state.modal.scale * 0.8);
    applyStageTransform();
  });

  document.getElementById('dl-m-zoom-reset').addEventListener('click', () => {
    state.modal.scale = 1;
    state.modal.panX = 0;
    state.modal.panY = 0;
    state.modal.rotation = 0;
    state.modal.flipH = 1;
    state.modal.flipV = 1;
    applyStageTransform();
  });

  document.getElementById('dl-m-rotate').addEventListener('click', () => {
    state.modal.rotation = (state.modal.rotation + 90) % 360;
    applyStageTransform();
  });

  document.getElementById('dl-m-fliph').addEventListener('click', () => {
    state.modal.flipH *= -1;
    applyStageTransform();
  });

  document.getElementById('dl-m-invert').addEventListener('click', (e) => {
    stage.classList.toggle('dl-filter-invert');
    e.currentTarget.classList.toggle('active');
  });

  document.getElementById('dl-m-contrast').addEventListener('click', (e) => {
    stage.classList.toggle('dl-filter-highcontrast');
    e.currentTarget.classList.toggle('active');
  });

  document.getElementById('dl-m-close').addEventListener('click', closeDeepZoomModal);

  // Modal Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (!state.isModalOpen) return;

    if (e.key === 'Escape') {
      closeDeepZoomModal();
    } else if (e.key === '=' || e.key === '+') {
      state.modal.scale = Math.min(10, state.modal.scale * 1.25);
      applyStageTransform();
    } else if (e.key === '-' || e.key === '_') {
      state.modal.scale = Math.max(0.1, state.modal.scale * 0.8);
      applyStageTransform();
    } else if (e.key === '0') {
      state.modal.scale = 1;
      state.modal.panX = 0;
      state.modal.panY = 0;
      state.modal.rotation = 0;
      applyStageTransform();
    } else if (e.key.toLowerCase() === 'r') {
      state.modal.rotation = (state.modal.rotation + 90) % 360;
      applyStageTransform();
    } else if (e.key.toLowerCase() === 'i') {
      document.getElementById('dl-m-invert').click();
    } else if (e.key.toLowerCase() === 'c') {
      copyModalTargetToClipboard();
    }
  });

  // Modal Copy and Save Actions
  document.getElementById('dl-m-copy').addEventListener('click', copyModalTargetToClipboard);
  document.getElementById('dl-m-save').addEventListener('click', saveModalTarget);

  function copyModalTargetToClipboard() {
    const stageChild = stage.firstElementChild;
    if (!stageChild) return;
    copyElementAsPng(stageChild);
  }

  function saveModalTarget() {
    const stageChild = stage.firstElementChild;
    if (!stageChild) return;
    if (stageChild.tagName === 'IMG') {
      downloadFile(stageChild.src, 'diagram-lens-export.png');
    } else {
      elementToPngDataUrl(stageChild, (dataUrl) => {
        downloadFile(dataUrl, 'diagram-lens-export.png');
      });
    }
  }

  // =========================================================================
  // Toolbar Buttons Actions
  // =========================================================================
  document.getElementById('dl-tb-zoom').addEventListener('click', () => {
    if (state.currentTarget) {
      openDeepZoomModal(state.currentTarget, state.targetType, state.targetSrc);
    }
  });

  document.getElementById('dl-tb-copy').addEventListener('click', () => {
    if (state.currentTarget) {
      copyElementAsPng(state.currentTarget);
    }
  });

  document.getElementById('dl-tb-snap').addEventListener('click', () => {
    if (state.currentTarget) {
      elementToPngDataUrl(state.currentTarget, (dataUrl) => {
        downloadFile(dataUrl, 'element-snapshot.png');
        showToast('Element screenshot saved! 📸');
      });
    }
  });

  document.getElementById('dl-tb-save').addEventListener('click', () => {
    if (state.currentTarget) {
      if (state.targetType === 'svg') {
        const svgUri = getSvgDataUri(state.currentTarget);
        downloadFile(svgUri, 'diagram-vector.svg');
      } else if (state.targetSrc) {
        downloadFile(state.targetSrc, 'diagram-asset.png');
      }
    }
  });

  // =========================================================================
  // Universal Image & Element Copying Engine
  // =========================================================================
  function copyElementAsPng(element) {
    elementToPngBlob(element, (blob) => {
      if (!blob) {
        showToast('Could not copy this image format', 'danger');
        return;
      }
      try {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          showToast('Copied to clipboard as PNG! 📋');
        }).catch(err => {
          console.debug('Direct clipboard write failed, trying fallback:', err);
          showToast('Clipboard permission needed or blocked', 'warning');
        });
      } catch (err) {
        showToast('Clipboard write failed', 'danger');
      }
    });
  }

  function elementToPngBlob(element, callback) {
    elementToPngDataUrl(element, (dataUrl) => {
      if (!dataUrl) {
        callback(null);
        return;
      }
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => callback(blob))
        .catch(() => callback(null));
    });
  }

  function elementToPngDataUrl(element, callback) {
    if (!element) return callback(null);

    // If already a canvas
    if (element.tagName === 'CANVAS') {
      try {
        return callback(element.toDataURL('image/png'));
      } catch (e) {
        // Continue to fallback
      }
    }

    // If SVG
    if (element.tagName === 'svg' || element.tagName === 'SVG') {
      const svgUri = getSvgDataUri(element);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || element.clientWidth || 600;
        canvas.height = img.naturalHeight || element.clientHeight || 400;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        callback(canvas.toDataURL('image/png'));
      };
      img.onerror = () => callback(null);
      img.src = svgUri;
      return;
    }

    // If IMG
    if (element.tagName === 'IMG') {
      const canvas = document.createElement('canvas');
      canvas.width = element.naturalWidth || element.clientWidth;
      canvas.height = element.naturalHeight || element.clientHeight;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        try {
          callback(canvas.toDataURL('image/png'));
        } catch (e) {
          // If tainted, fetch via background proxy
          fetchViaBackgroundProxy(element.src, callback);
        }
      };
      img.onerror = () => {
        fetchViaBackgroundProxy(element.src, callback);
      };
      img.src = element.src;
      return;
    }

    // Fallback for background-image
    const bgMatch = window.getComputedStyle(element).backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
    if (bgMatch && bgMatch[1]) {
      fetchViaBackgroundProxy(bgMatch[1], callback);
      return;
    }

    callback(null);
  }

  function fetchViaBackgroundProxy(url, callback) {
    chrome.runtime.sendMessage({ action: 'FETCH_IMAGE_BLOB', url: url }, (res) => {
      if (res && res.success && res.dataUrl) {
        callback(res.dataUrl);
      } else {
        callback(null);
      }
    });
  }

  function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // =========================================================================
  // Area Snipping Screenshot Tool
  // =========================================================================
  const snipBox = document.getElementById('diagram-lens-snip-box');
  const snipPill = document.getElementById('diagram-lens-snip-pill');
  const snipActions = document.getElementById('diagram-lens-snip-actions');
  let croppedDataUrl = null;

  function startSnippingMode() {
    loupe.classList.remove('dl-visible');
    toolbar.classList.remove('dl-active');
    state.isSnipActive = true;
    snipOverlay.classList.add('dl-active');
    snipBox.style.display = 'none';
    snipActions.style.display = 'none';
    showToast('Click and drag across any diagram or document area ✂️', 'success');
  }

  function stopSnippingMode() {
    state.isSnipActive = false;
    snipOverlay.classList.remove('dl-active');
    snipBox.style.display = 'none';
    snipActions.style.display = 'none';
    state.snip.isSelecting = false;
  }

  snipOverlay.addEventListener('mousedown', (e) => {
    if (e.target.closest('#diagram-lens-snip-actions')) return;
    state.snip.isSelecting = true;
    state.snip.startX = e.clientX;
    state.snip.startY = e.clientY;
    snipActions.style.display = 'none';

    snipBox.style.left = `${e.clientX}px`;
    snipBox.style.top = `${e.clientY}px`;
    snipBox.style.width = '0px';
    snipBox.style.height = '0px';
    snipBox.style.display = 'block';
  });

  snipOverlay.addEventListener('mousemove', (e) => {
    if (!state.snip.isSelecting) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(state.snip.startX, currentX);
    const top = Math.min(state.snip.startY, currentY);
    const width = Math.abs(currentX - state.snip.startX);
    const height = Math.abs(currentY - state.snip.startY);

    snipBox.style.left = `${left}px`;
    snipBox.style.top = `${top}px`;
    snipBox.style.width = `${width}px`;
    snipBox.style.height = `${height}px`;

    snipPill.textContent = `${width} × ${height} px`;
  });

  snipOverlay.addEventListener('mouseup', (e) => {
    if (!state.snip.isSelecting) return;
    state.snip.isSelecting = false;

    const rect = snipBox.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      snipBox.style.display = 'none';
      return;
    }

    state.snip.boxRect = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };

    // Capture tab and crop
    captureAndCropArea(state.snip.boxRect, (dataUrl) => {
      croppedDataUrl = dataUrl;
      snipActions.style.display = 'flex';
    });
  });

  function captureAndCropArea(box, callback) {
    // Hide UI elements momentarily before capture
    snipOverlay.style.opacity = '0';

    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' }, (response) => {
        snipOverlay.style.opacity = '1';

        if (!response || !response.success || !response.dataUrl) {
          showToast('Failed to capture screen', 'danger');
          return;
        }

        const img = new Image();
        img.onload = () => {
          const dpr = window.devicePixelRatio || 1;
          const canvas = document.createElement('canvas');
          canvas.width = box.width * dpr;
          canvas.height = box.height * dpr;
          const ctx = canvas.getContext('2d');

          ctx.drawImage(
            img,
            box.x * dpr,
            box.y * dpr,
            box.width * dpr,
            box.height * dpr,
            0,
            0,
            canvas.width,
            canvas.height
          );

          callback(canvas.toDataURL('image/png'));
        };
        img.src = response.dataUrl;
      });
    }, 50);
  }

  // Snip Actions
  document.getElementById('dl-snip-copy').addEventListener('click', () => {
    if (!croppedDataUrl) return;
    fetch(croppedDataUrl)
      .then(res => res.blob())
      .then(blob => {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Area screenshot copied to clipboard! 📋');
        stopSnippingMode();
      });
  });

  document.getElementById('dl-snip-download').addEventListener('click', () => {
    if (!croppedDataUrl) return;
    downloadFile(croppedDataUrl, 'screenshot-area.png');
    showToast('Screenshot downloaded! 📸');
    stopSnippingMode();
  });

  document.getElementById('dl-snip-deepzoom').addEventListener('click', () => {
    if (!croppedDataUrl) return;
    const url = croppedDataUrl;
    stopSnippingMode();
    openDeepZoomModal(null, 'img', url);
  });

  document.getElementById('dl-snip-cancel').addEventListener('click', stopSnippingMode);

  // =========================================================================
  // Background & Popup Message Listener
  // =========================================================================
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'TOGGLE_MAGNIFIER') {
      state.enabled = !state.enabled;
      chrome.storage.local.set({ magnifierEnabled: state.enabled });
      showToast(state.enabled ? `Magnifier Lens: Enabled (${state.zoomLevel}x) 🔍` : 'Magnifier Lens: Disabled ⚡');
      if (!state.enabled) loupe.classList.remove('dl-visible');
      sendResponse({ enabled: state.enabled });
    }

    if (request.action === 'START_SNIP') {
      startSnippingMode();
      sendResponse({ status: 'started' });
    }

    if (request.action === 'DEEP_ZOOM_URL' && request.srcUrl) {
      openDeepZoomModal(null, 'img', request.srcUrl);
      sendResponse({ status: 'opened' });
    }

    if (request.action === 'COPY_IMAGE_URL' && request.srcUrl) {
      const img = new Image();
      img.src = request.srcUrl;
      copyElementAsPng(img);
      sendResponse({ status: 'copying' });
    }

    // Page visual scan for popup gallery
    if (request.action === 'GET_PAGE_VISUALS') {
      const items = [];
      // Collect images
      document.querySelectorAll('img').forEach((img, idx) => {
        if (img.src && img.clientWidth > 40 && img.clientHeight > 40) {
          items.push({
            id: `img-${idx}`,
            type: 'Image',
            tag: 'img',
            src: img.currentSrc || img.src,
            width: img.naturalWidth || img.clientWidth,
            height: img.naturalHeight || img.clientHeight,
            alt: img.alt || `Image ${idx + 1}`
          });
        }
      });

      // Collect SVGs
      document.querySelectorAll('svg').forEach((svg, idx) => {
        if (svg.clientWidth > 40 && svg.clientHeight > 40) {
          items.push({
            id: `svg-${idx}`,
            type: 'SVG Diagram',
            tag: 'svg',
            src: getSvgDataUri(svg),
            width: Math.round(svg.clientWidth),
            height: Math.round(svg.clientHeight),
            alt: svg.getAttribute('aria-label') || `Vector Diagram ${idx + 1}`
          });
        }
      });

      // Collect Canvases
      document.querySelectorAll('canvas').forEach((canvas, idx) => {
        if (canvas.clientWidth > 40 && canvas.clientHeight > 40) {
          let src = '';
          try { src = canvas.toDataURL(); } catch (e) {}
          items.push({
            id: `canvas-${idx}`,
            type: 'Canvas Chart',
            tag: 'canvas',
            src: src,
            width: canvas.width || canvas.clientWidth,
            height: canvas.height || canvas.clientHeight,
            alt: `Interactive Chart ${idx + 1}`
          });
        }
      });

      sendResponse({ items: items.slice(0, 50) });
    }
    return true;
  });
})();
