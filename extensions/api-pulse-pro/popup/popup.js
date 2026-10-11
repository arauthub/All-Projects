// API Pulse Pro - Popup Controller

document.addEventListener('DOMContentLoaded', async () => {
  let activeTabId = null;
  let activeHost = 'Active Tab';
  let capturedRequests = [];
  let currentFilter = 'ALL';
  let currentSearch = '';
  let selectedReq = null;
  let activePreviewTab = 'res';

  // Get current active tab
  if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        activeTabId = tab.id;
        try {
          const url = new URL(tab.url);
          activeHost = url.hostname || tab.url;
        } catch (_) {
          activeHost = tab.title || 'Local Tab';
        }
      }
    } catch (_) {}
  }

  const hostEl = document.getElementById('current-host');
  if (hostEl) hostEl.textContent = activeHost;

  // Load requests
  async function loadRequests() {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage && activeTabId) {
      chrome.runtime.sendMessage({ type: 'GET_TAB_REQUESTS', tabId: activeTabId }, (res) => {
        capturedRequests = res?.requests || [];
        updateStats();
        renderList();
      });
    }
  }

  function updateStats() {
    const total = capturedRequests.length;
    const postCount = capturedRequests.filter(r => r.method === 'POST').length;
    const errCount = capturedRequests.filter(r => r.status >= 400 || r.status === 0).length;
    
    let avgLatency = 0;
    if (total > 0) {
      const sum = capturedRequests.reduce((acc, r) => acc + (r.duration || 0), 0);
      avgLatency = Math.round(sum / total);
    }

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-post').textContent = postCount;
    document.getElementById('stat-err').textContent = errCount;
    document.getElementById('stat-latency').textContent = `${avgLatency}ms`;
  }

  function renderList() {
    const listEl = document.getElementById('request-list');
    if (!listEl) return;

    const filtered = capturedRequests.filter(req => {
      if (currentFilter === 'POST' && req.method !== 'POST') return false;
      if (currentFilter === 'ERR' && !(req.status >= 400 || req.status === 0)) return false;
      if (currentSearch) {
        const full = (req.url + ' ' + req.method + ' ' + (req.status || '') + ' ' + (req.responseBody?.raw || '') + ' ' + (req.requestBody?.raw || '')).toLowerCase();
        if (!full.includes(currentSearch)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚡</div>
          <p>No matching requests found.</p>
          <small>Adjust filters or trigger API traffic on the page.</small>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    filtered.forEach(req => {
      const card = document.createElement('div');
      card.className = 'request-card';

      let statusCls = 'status-2xx';
      if (req.status >= 400 || req.status === 0) statusCls = 'status-err';

      let displayPath = req.pathname;
      if (!displayPath) {
        try { displayPath = new URL(req.url).pathname; } catch (_) { displayPath = req.url; }
      }

      const sizeStr = req.responseBody?.sizeBytes
        ? (req.responseBody.sizeBytes > 1024 ? `${(req.responseBody.sizeBytes / 1024).toFixed(1)} KB` : `${req.responseBody.sizeBytes} B`)
        : '';

      card.innerHTML = `
        <span class="req-method method-${req.method}">${req.method}</span>
        <div class="req-info">
          <div class="req-path" title="${req.url}">
            ${req.mocked ? '<span style="color:#a855f7;font-weight:700;">[MOCK]</span> ' : ''}
            ${displayPath}
          </div>
          <div class="req-sub">
            <span class="status-badge ${statusCls}">${req.status || 'ERR'}</span>
            <span>${req.duration}ms</span>
            ${sizeStr ? `<span>• ${sizeStr}</span>` : ''}
            <span>• ${new Date(req.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        openPreview(req);
      });

      listEl.appendChild(card);
    });
  }

  function openPreview(req) {
    selectedReq = req;
    const previewEl = document.getElementById('quick-preview');
    const titleEl = document.getElementById('preview-title');
    if (!previewEl) return;

    let path = req.pathname;
    try { path = new URL(req.url).pathname; } catch (_) { path = req.url; }
    titleEl.textContent = `${req.method} ${path}`;
    previewEl.style.display = 'flex';
    renderPreviewTab();
  }

  function renderPreviewTab() {
    const bodyEl = document.getElementById('preview-body');
    if (!bodyEl || !selectedReq) return;

    if (activePreviewTab === 'res') {
      const res = selectedReq.responseBody;
      if (!res) bodyEl.textContent = '(No response body)';
      else if (res.parsed) bodyEl.textContent = JSON.stringify(res.parsed, null, 2);
      else bodyEl.textContent = res.raw || '(Empty response)';
    } else if (activePreviewTab === 'req') {
      const body = selectedReq.requestBody;
      if (!body) bodyEl.textContent = '(No request payload / GET)';
      else if (body.parsed) bodyEl.textContent = JSON.stringify(body.parsed, null, 2);
      else bodyEl.textContent = body.raw || '(Empty payload)';
    } else if (activePreviewTab === 'headers') {
      const hReq = JSON.stringify(selectedReq.requestHeaders || {}, null, 2);
      const hRes = JSON.stringify(selectedReq.responseHeaders || {}, null, 2);
      bodyEl.textContent = `=== REQUEST HEADERS ===\n${hReq}\n\n=== RESPONSE HEADERS ===\n${hRes}`;
    }
  }

  // Event Listeners
  document.getElementById('btn-open-studio')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_STUDIO', tabId: activeTabId });
    window.close();
  });

  document.getElementById('preview-studio-view')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_STUDIO', tabId: activeTabId });
    window.close();
  });

  document.getElementById('btn-toggle-hud')?.addEventListener('click', () => {
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, { type: 'TOGGLE_HUD' }).catch(() => {});
    }
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    if (activeTabId) {
      chrome.runtime.sendMessage({ type: 'CLEAR_TAB_REQUESTS', tabId: activeTabId }, () => {
        capturedRequests = [];
        updateStats();
        renderList();
        document.getElementById('quick-preview').style.display = 'none';
      });
    }
  });

  document.getElementById('btn-export')?.addEventListener('click', () => {
    if (capturedRequests.length === 0) return;
    const blob = new Blob([JSON.stringify(capturedRequests, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-pulse-${activeHost.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Filter pills
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderList();
    });
  });

  // Search input
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    renderList();
  });

  // Preview drawer close
  document.getElementById('preview-close')?.addEventListener('click', () => {
    document.getElementById('quick-preview').style.display = 'none';
  });

  // Preview tabs
  document.querySelectorAll('.preview-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activePreviewTab = tab.dataset.tab;
      renderPreviewTab();
    });
  });

  // Copy cURL
  document.getElementById('preview-copy-curl')?.addEventListener('click', () => {
    if (!selectedReq) return;
    let curl = `curl -X ${selectedReq.method} "${selectedReq.url}"`;
    if (selectedReq.requestHeaders) {
      Object.entries(selectedReq.requestHeaders).forEach(([k, v]) => {
        if (['host', 'cookie'].includes(k.toLowerCase())) return;
        curl += ` \\\n  -H "${k}: ${v.replace(/"/g, '\\"')}"`;
      });
    }
    if (selectedReq.requestBody && selectedReq.method !== 'GET') {
      curl += ` \\\n  --data '${(selectedReq.requestBody.raw || '').replace(/'/g, "'\\''")}'`;
    }
    navigator.clipboard.writeText(curl).then(() => {
      const origText = document.getElementById('preview-copy-curl').textContent;
      document.getElementById('preview-copy-curl').textContent = 'Copied!';
      setTimeout(() => {
        document.getElementById('preview-copy-curl').textContent = origText;
      }, 1500);
    });
  });

  // Initial load and periodic refresh
  loadRequests();
  const interval = setInterval(loadRequests, 1200);
  window.addEventListener('unload', () => clearInterval(interval));
});
