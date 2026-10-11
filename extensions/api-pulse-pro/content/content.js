// API Pulse Pro - Content Script (ISOLATED World)
// Bridges MAIN-world interceptor, manages In-Page Floating HUD & Toast alerts

(function () {
  if (window.__API_PULSE_CONTENT_LOADED__) return;
  window.__API_PULSE_CONTENT_LOADED__ = true;

  // Fallback injection of interceptor.js if needed
  function ensureInterceptorInjected() {
    if (!document.getElementById('api-pulse-interceptor-tag')) {
      const script = document.createElement('script');
      script.id = 'api-pulse-interceptor-tag';
      script.src = chrome.runtime.getURL('content/interceptor.js');
      script.onload = () => script.remove();
      (document.head || document.documentElement).appendChild(script);
    }
  }
  ensureInterceptorInjected();

  // In-memory buffer of captured calls for current page session
  const pageRequests = [];
  let selectedRequestId = null;
  let activeFilter = 'ALL';
  let searchQuery = '';
  let activeDetailTab = 'response';

  // Sync initial mock rules from chrome.storage
  try {
    chrome.storage.local.get(['apiPulseMockRules', 'apiPulseSettings'], (data) => {
      if (data.apiPulseMockRules) {
        window.dispatchEvent(new CustomEvent('__api_pulse_sync_mocks__', {
          detail: { rules: data.apiPulseMockRules }
        }));
      }
    });
  } catch (_) {}

  // Listen for storage changes to sync mock rules in real time
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.apiPulseMockRules) {
        window.dispatchEvent(new CustomEvent('__api_pulse_sync_mocks__', {
          detail: { rules: changes.apiPulseMockRules.newValue || [] }
        }));
      }
    });
  } catch (_) {}

  // ----------------------------------------------------
  // DOM Setup: HUD Container
  // ----------------------------------------------------
  let rootEl = null;
  let pillEl = null;
  let drawerEl = null;
  let toastContainerEl = null;

  function initHUD() {
    if (rootEl) return;
    if (!document.body) {
      window.addEventListener('DOMContentLoaded', initHUD);
      return;
    }

    rootEl = document.createElement('div');
    rootEl.id = 'api-pulse-hud-root';

    // Toast Container
    toastContainerEl = document.createElement('div');
    toastContainerEl.className = 'api-pulse-toast-container';
    rootEl.appendChild(toastContainerEl);

    // Floating Pill Capsule
    pillEl = document.createElement('div');
    pillEl.className = 'api-pulse-pill';
    pillEl.title = 'API Pulse Pro - Click to open inspector (Alt+Shift+P)';
    pillEl.innerHTML = `
      <div class="api-pulse-icon-wrap">
        <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <span class="api-pulse-ping" id="api-pulse-ping-dot"></span>
      </div>
      <div class="api-pulse-stats">
        <span class="api-pulse-badge api-pulse-badge-all" id="api-pulse-total-count">0 APIs</span>
        <span class="api-pulse-badge api-pulse-badge-post" id="api-pulse-post-count">0 POST</span>
        <span class="api-pulse-badge api-pulse-badge-error" id="api-pulse-err-count" style="display:none;">0 ERR</span>
      </div>
      <button class="api-pulse-expand-btn" id="api-pulse-toggle-btn" title="Expand Quick Drawer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
      </button>
    `;
    rootEl.appendChild(pillEl);

    // Quick Inspector Drawer
    drawerEl = document.createElement('div');
    drawerEl.className = 'api-pulse-drawer';
    drawerEl.innerHTML = `
      <div class="api-pulse-drawer-header">
        <div class="api-pulse-drawer-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <span>API Pulse Quick Inspector</span>
        </div>
        <div class="api-pulse-actions-wrap">
          <button class="api-pulse-btn-icon api-pulse-btn-primary" id="api-pulse-btn-studio" title="Open Full Screen Studio Workbench">
            <span>🚀 Full Studio</span>
          </button>
          <button class="api-pulse-btn-icon" id="api-pulse-btn-clear" title="Clear captured calls">
            <span>Clear</span>
          </button>
          <button class="api-pulse-btn-icon" id="api-pulse-btn-close" title="Close drawer">
            <span>✕</span>
          </button>
        </div>
      </div>
      <div class="api-pulse-drawer-bar">
        <input type="text" class="api-pulse-search" id="api-pulse-search-input" placeholder="Filter URL, payload, or status...">
        <div class="api-pulse-filters">
          <span class="api-pulse-filter-tag active" data-filter="ALL">ALL</span>
          <span class="api-pulse-filter-tag" data-filter="POST">POST</span>
          <span class="api-pulse-filter-tag" data-filter="ERR">ERRORS</span>
        </div>
      </div>
      <div class="api-pulse-list" id="api-pulse-items-list">
        <div class="api-pulse-empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <span>Waiting for API calls... Trigger fetch or submit a POST form on this page!</span>
        </div>
      </div>
      <div class="api-pulse-detail" id="api-pulse-detail-pane" style="display:none;">
        <div class="api-pulse-detail-nav">
          <div class="api-pulse-detail-tab active" data-tab="response">Response</div>
          <div class="api-pulse-detail-tab" data-tab="payload">Payload</div>
          <div class="api-pulse-detail-tab" data-tab="headers">Headers</div>
          <div class="api-pulse-detail-tab" data-tab="overview">Overview</div>
          <div style="margin-left:auto; display:flex; align-items:center; gap:6px; padding-right:8px;">
            <button class="api-pulse-btn-icon" id="api-pulse-btn-curl" title="Copy as cURL">cURL</button>
            <button class="api-pulse-btn-icon" id="api-pulse-btn-replay" title="Replay in page context">⚡ Replay</button>
          </div>
        </div>
        <div class="api-pulse-detail-body" id="api-pulse-detail-content"></div>
      </div>
    `;
    rootEl.appendChild(drawerEl);

    document.body.appendChild(rootEl);
    setupEventListeners();
    restorePosition();
  }

  // ----------------------------------------------------
  // Draggable Floating Pill Logic
  // ----------------------------------------------------
  function restorePosition() {
    try {
      const saved = localStorage.getItem('__api_pulse_hud_pos__');
      if (saved) {
        const { x, y } = JSON.parse(saved);
        pillEl.style.left = `${Math.max(10, Math.min(window.innerWidth - 180, x))}px`;
        pillEl.style.top = `${Math.max(10, Math.min(window.innerHeight - 50, y))}px`;
        pillEl.style.right = 'auto';
        pillEl.style.bottom = 'auto';
      }
    } catch (_) {}
  }

  function setupEventListeners() {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;
    let hasMoved = false;

    pillEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('#api-pulse-toggle-btn')) return;
      isDragging = true;
      hasMoved = false;
      const rect = pillEl.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      origLeft = rect.left;
      origTop = rect.top;

      function onMouseMove(moveEvent) {
        if (!isDragging) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.hypot(dx, dy) > 5) hasMoved = true;
        
        const newLeft = Math.max(10, Math.min(window.innerWidth - rect.width - 10, origLeft + dx));
        const newTop = Math.max(10, Math.min(window.innerHeight - rect.height - 10, origTop + dy));

        pillEl.style.left = `${newLeft}px`;
        pillEl.style.top = `${newTop}px`;
        pillEl.style.right = 'auto';
        pillEl.style.bottom = 'auto';
      }

      function onMouseUp() {
        if (isDragging) {
          isDragging = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          try {
            const rect = pillEl.getBoundingClientRect();
            localStorage.setItem('__api_pulse_hud_pos__', JSON.stringify({ x: rect.left, y: rect.top }));
          } catch (_) {}
        }
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    pillEl.addEventListener('click', (e) => {
      if (hasMoved) return;
      toggleDrawer();
    });

    document.getElementById('api-pulse-toggle-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDrawer();
    });

    document.getElementById('api-pulse-btn-close')?.addEventListener('click', () => {
      closeDrawer();
    });

    document.getElementById('api-pulse-btn-clear')?.addEventListener('click', () => {
      pageRequests.length = 0;
      selectedRequestId = null;
      renderList();
      updateBadgeCounts();
    });

    document.getElementById('api-pulse-btn-studio')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_STUDIO' });
    });

    // Filter Buttons
    drawerEl.querySelectorAll('.api-pulse-filter-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        drawerEl.querySelectorAll('.api-pulse-filter-tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        activeFilter = tag.dataset.filter;
        renderList();
      });
    });

    // Search Box
    const searchInput = document.getElementById('api-pulse-search-input');
    searchInput?.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderList();
    });

    // Detail Subtabs
    drawerEl.querySelectorAll('.api-pulse-detail-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        drawerEl.querySelectorAll('.api-pulse-detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeDetailTab = tab.dataset.tab;
        renderDetailContent();
      });
    });

    // Replay in Page Button
    document.getElementById('api-pulse-btn-replay')?.addEventListener('click', () => {
      const req = pageRequests.find(r => r.id === selectedRequestId);
      if (!req) return;
      replayRequest(req);
    });

    // Copy cURL Button
    document.getElementById('api-pulse-btn-curl')?.addEventListener('click', () => {
      const req = pageRequests.find(r => r.id === selectedRequestId);
      if (!req) return;
      const curl = generateCurl(req);
      navigator.clipboard.writeText(curl).then(() => {
        showToast({
          method: 'COPY',
          url: 'cURL command copied to clipboard!',
          status: 200,
          statusText: 'Copied'
        });
      });
    });

    // Keyboard Shortcuts (Safe & non-conflicting: Alt+Shift+P for Pulse)
    window.addEventListener('keydown', (e) => {
      // Never intercept standard typing or text selection shortcuts (Ctrl+A, Cmd+A, etc.)
      const isEditable = e.target && (
        e.target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      );

      // Close drawer on Escape if it is currently open
      if (e.key === 'Escape' && drawerEl && drawerEl.classList.contains('open')) {
        e.preventDefault();
        closeDrawer();
        return;
      }

      // Toggle drawer strictly with Alt+Shift+P (P for Pulse)
      // Never trigger on Cmd+A, Ctrl+A, Alt+A, or standard text selection
      if (
        !isEditable &&
        e.altKey &&
        e.shiftKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')
      ) {
        e.preventDefault();
        toggleDrawer();
      }
    });
  }

  function toggleDrawer() {
    if (!drawerEl) return;
    if (drawerEl.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  function openDrawer() {
    if (!drawerEl) return;
    drawerEl.classList.add('open');
    renderList();
  }

  function closeDrawer() {
    if (!drawerEl) return;
    drawerEl.classList.remove('open');
  }

  // ----------------------------------------------------
  // Request Processing & Toast Alerts
  // ----------------------------------------------------
  window.addEventListener('__api_pulse_captured__', (e) => {
    const data = e.detail;
    if (!data) return;

    pageRequests.unshift(data);
    if (pageRequests.length > 200) pageRequests.pop();

    initHUD();
    updateBadgeCounts();

    // Trigger Ping Animation
    const pingDot = document.getElementById('api-pulse-ping-dot');
    if (pingDot) {
      pingDot.classList.add('active');
      setTimeout(() => pingDot.classList.remove('active'), 1500);
    }

    // Show Toast notification if POST or Error
    if (data.method === 'POST' || data.status >= 400 || data.status === 0) {
      showToast(data);
    }

    if (drawerEl && drawerEl.classList.contains('open')) {
      renderList();
    }

    // Relay to extension background worker
    try {
      chrome.runtime.sendMessage({
        type: 'REQ_CAPTURED',
        request: data
      });
    } catch (_) {}
  });

  function updateBadgeCounts() {
    const total = pageRequests.length;
    const postCount = pageRequests.filter(r => r.method === 'POST').length;
    const errCount = pageRequests.filter(r => r.status >= 400 || r.status === 0).length;

    const totalEl = document.getElementById('api-pulse-total-count');
    const postEl = document.getElementById('api-pulse-post-count');
    const errEl = document.getElementById('api-pulse-err-count');

    if (totalEl) totalEl.textContent = `${total} APIs`;
    if (postEl) postEl.textContent = `${postCount} POST`;
    if (errEl) {
      if (errCount > 0) {
        errEl.textContent = `${errCount} ERR`;
        errEl.style.display = 'inline-flex';
      } else {
        errEl.style.display = 'none';
      }
    }
  }

  function showToast(req) {
    if (!toastContainerEl) return;
    const toast = document.createElement('div');
    toast.className = 'api-pulse-toast';
    const isErr = req.status >= 400 || req.status === 0;

    let path = req.pathname || req.url;
    try {
      path = new URL(req.url, window.location.href).pathname;
    } catch (_) {}

    toast.innerHTML = `
      <span class="api-pulse-toast-method api-pulse-method-${req.method}">${req.method}</span>
      <span class="api-pulse-toast-url" title="${req.url}">${path}</span>
      <span class="api-pulse-toast-status ${isErr ? 'api-pulse-status-err' : 'api-pulse-status-ok'}">
        ${req.status || 'ERR'} ${req.duration ? `• ${req.duration}ms` : ''}
      </span>
    `;

    toast.addEventListener('click', () => {
      openDrawer();
      selectRequest(req.id);
      toast.remove();
    });

    toastContainerEl.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // ----------------------------------------------------
  // List & Detail Rendering inside Quick Drawer
  // ----------------------------------------------------
  function renderList() {
    const listEl = document.getElementById('api-pulse-items-list');
    if (!listEl) return;

    let filtered = pageRequests.filter(req => {
      if (activeFilter === 'POST' && req.method !== 'POST') return false;
      if (activeFilter === 'ERR' && !(req.status >= 400 || req.status === 0)) return false;
      if (searchQuery) {
        const str = (req.url + ' ' + req.method + ' ' + (req.status || '') + ' ' + (req.responseBody?.raw || '') + ' ' + (req.requestBody?.raw || '')).toLowerCase();
        if (!str.includes(searchQuery)) return false;
      }
      return true;
    });

    if (!filtered.length) {
      listEl.innerHTML = `
        <div class="api-pulse-empty-state">
          <span>No requests match current filter.</span>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    filtered.forEach(req => {
      const item = document.createElement('div');
      item.className = `api-pulse-item ${req.id === selectedRequestId ? 'selected' : ''}`;
      const isErr = req.status >= 400 || req.status === 0;

      let displayPath = req.pathname;
      if (!displayPath) {
        try { displayPath = new URL(req.url, window.location.href).pathname; } catch (_) { displayPath = req.url; }
      }

      item.innerHTML = `
        <span class="api-pulse-item-method api-pulse-method-${req.method}">${req.method}</span>
        <span class="api-pulse-item-path" title="${req.url}">
          ${req.mocked ? '<span style="color:#a855f7;font-weight:700;">[MOCK]</span> ' : ''}
          ${displayPath}
        </span>
        <div class="api-pulse-item-meta">
          <span class="api-pulse-item-status ${isErr ? 'api-pulse-status-err' : 'api-pulse-status-ok'}">
            ${req.status || 'ERR'}
          </span>
          <span>${req.duration}ms</span>
        </div>
      `;

      item.addEventListener('click', () => {
        selectRequest(req.id);
      });

      listEl.appendChild(item);
    });
  }

  function selectRequest(id) {
    selectedRequestId = id;
    renderList();
    const detailPane = document.getElementById('api-pulse-detail-pane');
    if (detailPane) {
      detailPane.style.display = 'flex';
      renderDetailContent();
    }
  }

  function renderDetailContent() {
    const contentEl = document.getElementById('api-pulse-detail-content');
    if (!contentEl) return;
    const req = pageRequests.find(r => r.id === selectedRequestId);
    if (!req) {
      contentEl.textContent = 'Select a request to view details';
      return;
    }

    if (activeDetailTab === 'response') {
      const res = req.responseBody;
      if (!res) {
        contentEl.textContent = '(No response captured)';
      } else if (res.parsed) {
        contentEl.textContent = JSON.stringify(res.parsed, null, 2);
      } else {
        contentEl.textContent = res.raw || '(Empty response)';
      }
    } else if (activeDetailTab === 'payload') {
      const body = req.requestBody;
      if (!body) {
        contentEl.textContent = '(No request body / GET request)';
      } else if (body.parsed) {
        contentEl.textContent = JSON.stringify(body.parsed, null, 2);
      } else {
        contentEl.textContent = body.raw || '(Empty payload)';
      }
    } else if (activeDetailTab === 'headers') {
      const reqH = JSON.stringify(req.requestHeaders || {}, null, 2);
      const resH = JSON.stringify(req.responseHeaders || {}, null, 2);
      contentEl.textContent = `=== REQUEST HEADERS ===\n${reqH}\n\n=== RESPONSE HEADERS ===\n${resH}`;
    } else if (activeDetailTab === 'overview') {
      contentEl.textContent = [
        `URL: ${req.url}`,
        `Method: ${req.method}`,
        `Status: ${req.status} ${req.statusText}`,
        `Duration: ${req.duration} ms`,
        `Type: ${req.type.toUpperCase()}`,
        `Initiator: ${req.initiator}`,
        `Timestamp: ${new Date(req.timestamp).toLocaleTimeString()}`,
        req.mocked ? 'MOCKED: Yes' : 'MOCKED: No'
      ].join('\n');
    }
  }

  // ----------------------------------------------------
  // Replay Execution
  // ----------------------------------------------------
  function replayRequest(req) {
    const replayId = 'rep_' + Date.now();
    showToast({
      method: req.method,
      url: `Replaying ${req.pathname || req.url}...`,
      status: '...',
      statusText: 'In-Flight'
    });

    const handler = (e) => {
      if (e.detail?.replayId === replayId) {
        window.removeEventListener('__api_pulse_replay_result__', handler);
        const res = e.detail;
        if (res.success) {
          showToast({
            method: 'REPLAY',
            url: `${req.pathname || req.url} replayed`,
            status: res.status,
            statusText: res.statusText,
            duration: res.duration
          });
        } else {
          showToast({
            method: 'REPLAY',
            url: `Replay error: ${res.error}`,
            status: 'ERR',
            statusText: 'Failed'
          });
        }
      }
    };
    window.addEventListener('__api_pulse_replay_result__', handler);

    window.dispatchEvent(new CustomEvent('__api_pulse_replay_exec__', {
      detail: {
        replayId,
        url: req.url,
        method: req.method,
        headers: req.requestHeaders,
        body: req.requestBody?.raw || null
      }
    }));
  }

  function generateCurl(req) {
    let curl = `curl -X ${req.method} "${req.url}"`;
    if (req.requestHeaders) {
      Object.entries(req.requestHeaders).forEach(([k, v]) => {
        // Skip browser-managed headers
        if (['host', 'content-length', 'cookie'].includes(k.toLowerCase())) return;
        curl += ` \\\n  -H "${k}: ${v.replace(/"/g, '\\"')}"`;
      });
    }
    if (req.requestBody && req.method !== 'GET' && req.method !== 'HEAD') {
      const raw = req.requestBody.raw || '';
      curl += ` \\\n  --data '${raw.replace(/'/g, "'\\''")}'`;
    }
    return curl;
  }

  // ----------------------------------------------------
  // Message listener from Popup/Background
  // ----------------------------------------------------
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_HUD') {
      initHUD();
      toggleDrawer();
      sendResponse({ ok: true });
    } else if (message.type === 'GET_PAGE_REQUESTS') {
      sendResponse({ requests: pageRequests });
    } else if (message.type === 'REPLAY_REQUEST') {
      const { url, method, headers, body } = message.payload || {};
      const replayId = 'rep_studio_' + Date.now();
      
      const onResult = (e) => {
        if (e.detail?.replayId === replayId) {
          window.removeEventListener('__api_pulse_replay_result__', onResult);
          sendResponse(e.detail);
        }
      };
      window.addEventListener('__api_pulse_replay_result__', onResult);

      window.dispatchEvent(new CustomEvent('__api_pulse_replay_exec__', {
        detail: { replayId, url, method, headers, body }
      }));

      // 10s fallback timeout
      setTimeout(() => {
        window.removeEventListener('__api_pulse_replay_result__', onResult);
      }, 10000);
      return true; // Keep async response channel open
    }
    return true;
  });

  // Self initialize when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHUD);
  } else {
    initHUD();
  }
})();
