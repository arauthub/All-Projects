// API Pulse Studio Pro - Master Workbench Controller

(function () {
  let allRequests = [];
  let selectedReqId = null;
  let activeTabId = null;
  let activeFilter = 'ALL';
  let searchQuery = '';
  let activeMainTab = 'response';
  let isRecording = true;
  let autoScroll = true;
  let activeCodeLang = 'curl';
  let pinnedIds = new Set();
  let mockRules = [];

  // Safe Storage Abstraction
  const StorageUtil = {
    async get(keys) {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        return new Promise(resolve => chrome.storage.local.get(keys, resolve));
      }
      const res = {};
      keys.forEach(k => {
        try {
          const val = localStorage.getItem(k);
          if (val !== null) res[k] = JSON.parse(val);
        } catch (_) {}
      });
      return res;
    },
    async set(obj) {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        return new Promise(resolve => chrome.storage.local.set(obj, resolve));
      }
      Object.entries(obj).forEach(([k, v]) => {
        try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {}
      });
    }
  };

  // Parse URL tabId parameter
  const urlParams = new URLSearchParams(window.location.search);
  const paramTabId = urlParams.get('tabId');
  if (paramTabId) {
    activeTabId = parseInt(paramTabId, 10);
  }

  // Restore pinned from localStorage
  try {
    const savedPinned = localStorage.getItem('apiPulsePinnedIds');
    if (savedPinned) pinnedIds = new Set(JSON.parse(savedPinned));
  } catch (_) {}

  // ----------------------------------------------------
  // Initialization
  // ----------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    await initTabSelector();
    await loadMockRules();
    seedInitialDemoData();
    setupSplitter();
    setupEventHandlers();
    startPolling();
  });

  function seedInitialDemoData() {
    if (allRequests.length === 0) {
      allRequests = [
        {
          id: 'demo_req_1',
          method: 'POST',
          url: 'https://api.cloudstore.io/v1/auth/login',
          pathname: '/v1/auth/login',
          status: 200,
          statusText: 'OK',
          duration: 94,
          timestamp: Date.now() - 15000,
          initiator: 'auth-service.ts:42',
          type: 'fetch',
          requestHeaders: {
            'content-type': 'application/json',
            'x-client-platform': 'web-dashboard'
          },
          requestBody: {
            isJson: true,
            raw: JSON.stringify({ email: 'developer@company.internal', rememberMe: true }, null, 2),
            parsed: { email: 'developer@company.internal', rememberMe: true }
          },
          responseHeaders: {
            'content-type': 'application/json; charset=utf-8',
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTA5MiIsImVtYWlsIjoiZGV2QGNvbXBhbnkuaW8iLCJyb2xlIjoiU3RhZmYgRW5naW5lZXIiLCJleHAiOjE5MTY3OTM2MDB9.SIGNATURE_HASH'
          },
          responseBody: {
            isJson: true,
            sizeBytes: 420,
            raw: JSON.stringify({
              status: 'authenticated',
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTA5MiIsImVtYWlsIjoiZGV2QGNvbXBhbnkuaW8iLCJyb2xlIjoiU3RhZmYgRW5naW5lZXIiLCJleHAiOjE5MTY3OTM2MDB9.SIGNATURE_HASH',
              user: { id: 'usr_9092', name: 'Alex Engineer', role: 'Staff Engineer' }
            }, null, 2),
            parsed: {
              status: 'authenticated',
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTA5MiIsImVtYWlsIjoiZGV2QGNvbXBhbnkuaW8iLCJyb2xlIjoiU3RhZmYgRW5naW5lZXIiLCJleHAiOjE5MTY3OTM2MDB9.SIGNATURE_HASH',
              user: { id: 'usr_9092', name: 'Alex Engineer', role: 'Staff Engineer' }
            }
          }
        },
        {
          id: 'demo_req_2',
          method: 'POST',
          url: 'https://api.cloudstore.io/v1/checkout/orders',
          pathname: '/v1/checkout/orders',
          status: 201,
          statusText: 'Created',
          duration: 185,
          timestamp: Date.now() - 32000,
          initiator: 'checkout.tsx:118',
          type: 'fetch',
          requestHeaders: {
            'content-type': 'application/json',
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.demo.signature'
          },
          requestBody: {
            isJson: true,
            raw: JSON.stringify({ orderId: 'ord_9182', items: [{ sku: 'pro_license', qty: 1, price: 99.00 }], total: 99.00 }, null, 2),
            parsed: { orderId: 'ord_9182', items: [{ sku: 'pro_license', qty: 1, price: 99.00 }], total: 99.00 }
          },
          responseHeaders: { 'content-type': 'application/json' },
          responseBody: {
            isJson: true,
            sizeBytes: 198,
            raw: JSON.stringify({ success: true, trackingCode: 'TRK-9812-US', estimatedDelivery: '2026-10-18' }, null, 2),
            parsed: { success: true, trackingCode: 'TRK-9812-US', estimatedDelivery: '2026-10-18' }
          }
        },
        {
          id: 'demo_req_3',
          method: 'POST',
          url: 'https://api.cloudstore.io/graphql',
          pathname: '/graphql',
          status: 200,
          statusText: 'OK',
          duration: 64,
          timestamp: Date.now() - 48000,
          initiator: 'apollo-client.ts:89',
          type: 'fetch',
          graphql: { isGraphQL: true, operationName: 'SubmitReview' },
          requestHeaders: { 'content-type': 'application/json' },
          requestBody: {
            isJson: true,
            raw: JSON.stringify({ query: 'mutation SubmitReview { addReview(rating: 5) { id status } }' }, null, 2),
            parsed: { query: 'mutation SubmitReview { addReview(rating: 5) { id status } }' }
          },
          responseHeaders: { 'content-type': 'application/json' },
          responseBody: {
            isJson: true,
            sizeBytes: 110,
            raw: JSON.stringify({ data: { addReview: { id: 'rev_401', status: 'published' } } }, null, 2),
            parsed: { data: { addReview: { id: 'rev_401', status: 'published' } } }
          }
        }
      ];
      selectedReqId = 'demo_req_1';
      updateCounts();
      renderStreamList();
      renderInspectorDetails(allRequests[0]);
    }
  }

  async function initTabSelector() {
    const selector = document.getElementById('select-target-tab');
    if (!selector) return;

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        const tabs = await chrome.tabs.query({});
        selector.innerHTML = '';
        tabs.forEach(t => {
          if (!t.url || t.url.startsWith('chrome://')) return;
          const opt = document.createElement('option');
          opt.value = t.id;
          try {
            const u = new URL(t.url);
            opt.textContent = `${u.hostname} - ${t.title ? t.title.slice(0, 30) : ''}`;
          } catch (_) {
            opt.textContent = t.title ? t.title.slice(0, 35) : `Tab ${t.id}`;
          }
          if (activeTabId && t.id === activeTabId) opt.selected = true;
          selector.appendChild(opt);
        });

        if (!activeTabId && selector.options.length > 0) {
          activeTabId = parseInt(selector.options[0].value, 10);
        }

        selector.addEventListener('change', (e) => {
          activeTabId = parseInt(e.target.value, 10);
          fetchRequests();
        });
      }
    } catch (_) {}
  }

  async function loadMockRules() {
    try {
      const data = await StorageUtil.get(['apiPulseMockRules']);
      mockRules = data.apiPulseMockRules || [];
      updateMockBadge();
    } catch (_) {}
  }

  function updateMockBadge() {
    const badge = document.getElementById('mock-count-badge');
    if (badge) badge.textContent = mockRules.filter(r => r.enabled).length;
  }

  // ----------------------------------------------------
  // Polling Stream & Background Communication
  // ----------------------------------------------------
  function startPolling() {
    fetchRequests();
    setInterval(() => {
      if (isRecording) fetchRequests();
    }, 1000);
  }

  function fetchRequests() {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage && activeTabId) {
      chrome.runtime.sendMessage({ type: 'GET_TAB_REQUESTS', tabId: activeTabId }, (res) => {
        if (res && res.requests && res.requests.length > 0) {
          allRequests = res.requests;
          updateCounts();
          renderStreamList();
          if (selectedReqId) {
            const req = allRequests.find(r => r.id === selectedReqId);
            if (req) renderInspectorDetails(req);
          }
        }
      });
    }
  }

  // ----------------------------------------------------
  // Statistics & Filter Counters
  // ----------------------------------------------------
  function updateCounts() {
    const total = allRequests.length;
    const post = allRequests.filter(r => r.method === 'POST').length;
    const get = allRequests.filter(r => r.method === 'GET').length;
    const put = allRequests.filter(r => ['PUT', 'PATCH'].includes(r.method)).length;
    const del = allRequests.filter(r => r.method === 'DELETE').length;
    const gql = allRequests.filter(r => r.graphql?.isGraphQL).length;
    const err = allRequests.filter(r => r.status >= 400 || r.status === 0).length;
    const slow = allRequests.filter(r => (r.duration || 0) > 500).length;

    document.getElementById('count-all').textContent = total;
    document.getElementById('count-post').textContent = post;
    document.getElementById('count-get').textContent = get;
    document.getElementById('count-put').textContent = put;
    document.getElementById('count-del').textContent = del;
    document.getElementById('count-gql').textContent = gql;
    document.getElementById('count-err').textContent = err;
    document.getElementById('count-slow').textContent = slow;

    const totalBytes = allRequests.reduce((acc, r) => acc + (r.responseBody?.sizeBytes || 0), 0);
    const kb = (totalBytes / 1024).toFixed(1);
    document.getElementById('footer-summary').textContent = `${total} requests (${post} POST, ${err} errors)`;
    document.getElementById('footer-data-transferred').textContent = `${kb} KB transferred`;
  }

  // ----------------------------------------------------
  // Stream List Rendering (Left Pane)
  // ----------------------------------------------------
  function renderStreamList() {
    const container = document.getElementById('stream-request-list');
    if (!container) return;

    let filtered = allRequests.filter(req => {
      if (activeFilter === 'POST' && req.method !== 'POST') return false;
      if (activeFilter === 'GET' && req.method !== 'GET') return false;
      if (activeFilter === 'PUT' && !['PUT', 'PATCH'].includes(req.method)) return false;
      if (activeFilter === 'DELETE' && req.method !== 'DELETE') return false;
      if (activeFilter === 'GQL' && !req.graphql?.isGraphQL) return false;
      if (activeFilter === 'ERR' && !(req.status >= 400 || req.status === 0)) return false;
      if (activeFilter === 'SLOW' && (req.duration || 0) <= 500) return false;

      if (searchQuery) {
        const full = (req.url + ' ' + req.method + ' ' + (req.status || '') + ' ' + (req.responseBody?.raw || '') + ' ' + (req.requestBody?.raw || '')).toLowerCase();
        if (!full.includes(searchQuery)) return false;
      }
      return true;
    });

    // Pinned to top
    filtered.sort((a, b) => {
      const aPin = pinnedIds.has(a.id) ? 1 : 0;
      const bPin = pinnedIds.has(b.id) ? 1 : 0;
      return bPin - aPin;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-stream-state">
          <div class="empty-art">⚡</div>
          <h3>No matching API requests</h3>
          <p>Change filters or search term to view captured network traffic.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    filtered.forEach(req => {
      const row = document.createElement('div');
      const isPinned = pinnedIds.has(req.id);
      row.className = `stream-row ${req.id === selectedReqId ? 'active' : ''} ${isPinned ? 'pinned' : ''}`;
      
      const isErr = req.status >= 400 || req.status === 0;
      const isSlow = (req.duration || 0) > 500;
      
      let displayPath = req.pathname;
      if (!displayPath) {
        try { displayPath = new URL(req.url).pathname; } catch (_) { displayPath = req.url; }
      }

      const sizeStr = req.responseBody?.sizeBytes
        ? (req.responseBody.sizeBytes > 1024 ? `${(req.responseBody.sizeBytes / 1024).toFixed(1)}k` : `${req.responseBody.sizeBytes}b`)
        : '-';

      row.innerHTML = `
        <span class="row-star ${isPinned ? 'starred' : ''}" title="Pin request">★</span>
        <span class="row-method method-${req.method}">${req.method}</span>
        <span class="row-status ${isErr ? 'status-err' : 'status-ok'}">${req.status || 'ERR'}</span>
        <span class="row-path" title="${req.url}">
          ${req.mocked ? '<span style="color:#a855f7;font-weight:700;">[MOCK]</span> ' : ''}
          ${req.graphql?.isGraphQL ? `<span style="color:#38bdf8;font-weight:700;">[GQL: ${req.graphql.operationName}]</span> ` : ''}
          ${displayPath}
        </span>
        <span class="row-latency ${isSlow ? 'slow' : ''}">${req.duration}ms</span>
        <span class="row-size">${sizeStr}</span>
        <span class="row-time">${new Date(req.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}</span>
      `;

      // Star pin handler
      row.querySelector('.row-star').addEventListener('click', (e) => {
        e.stopPropagation();
        if (pinnedIds.has(req.id)) pinnedIds.delete(req.id);
        else pinnedIds.add(req.id);
        try { localStorage.setItem('apiPulsePinnedIds', JSON.stringify([...pinnedIds])); } catch (_) {}
        renderStreamList();
      });

      row.addEventListener('click', () => {
        selectedReqId = req.id;
        renderStreamList();
        renderInspectorDetails(req);
      });

      container.appendChild(row);
    });

    if (autoScroll && !selectedReqId) {
      container.scrollTop = 0;
    }
  }

  // ----------------------------------------------------
  // Right Inspector Pane Rendering
  // ----------------------------------------------------
  function renderInspectorDetails(req) {
    document.getElementById('no-selection-pane').style.display = 'none';
    document.getElementById('active-inspector-pane').style.display = 'flex';

    // Header values
    const methodBadge = document.getElementById('insp-method');
    methodBadge.textContent = req.method;
    methodBadge.className = `method-badge method-${req.method}`;

    const statusBadge = document.getElementById('insp-status');
    statusBadge.textContent = `${req.status || 'ERR'} ${req.statusText || ''}`;
    statusBadge.style.color = (req.status >= 400 || req.status === 0) ? '#f87171' : '#34d399';

    document.getElementById('insp-full-url').value = req.url;

    // 1. Response Tab
    const respBodyEl = document.getElementById('code-response-body');
    const resp = req.responseBody;
    const respSizePill = document.getElementById('resp-size-pill');
    respSizePill.textContent = resp?.sizeBytes ? `${(resp.sizeBytes / 1024).toFixed(1)} KB` : '0 B';

    if (!resp || !resp.raw) {
      respBodyEl.textContent = '(Empty response body)';
    } else if (resp.parsed) {
      respBodyEl.textContent = JSON.stringify(resp.parsed, null, 2);
    } else {
      respBodyEl.textContent = resp.raw;
    }

    // 2. Payload Tab
    const reqBodyEl = document.getElementById('code-payload-body');
    const reqBody = req.requestBody;
    const reqSizePill = document.getElementById('req-size-pill');
    reqSizePill.textContent = reqBody?.raw ? `${(reqBody.raw.length / 1024).toFixed(1)} KB` : '0 B';

    if (!reqBody || !reqBody.raw) {
      reqBodyEl.textContent = '(No request body sent)';
    } else if (reqBody.parsed) {
      reqBodyEl.textContent = JSON.stringify(reqBody.parsed, null, 2);
    } else {
      reqBodyEl.textContent = reqBody.raw;
    }

    // 3. Headers Tab
    renderHeadersTable('table-req-headers', req.requestHeaders);
    renderHeadersTable('table-res-headers', req.responseHeaders);

    // 4. Replay Studio Prep
    document.getElementById('replay-method').value = req.method;
    document.getElementById('replay-url').value = req.url;
    document.getElementById('replay-body-input').value = req.requestBody?.raw || '';
    
    let rawH = '';
    if (req.requestHeaders) {
      Object.entries(req.requestHeaders).forEach(([k, v]) => {
        if (!['cookie', 'host'].includes(k.toLowerCase())) rawH += `${k}: ${v}\n`;
      });
    }
    document.getElementById('replay-headers-input').value = rawH;

    // 5. TypeScript Types
    const tsCode = generateTypeScriptTypes(req);
    document.getElementById('code-ts-types').textContent = tsCode;

    // 6. Code Generators
    renderCodeSnippet(req);

    // 7. Security Scanner
    scanSecurityTokens(req);

    // 8. Timing Breakdown
    document.getElementById('time-total').textContent = `${req.duration} ms`;
    document.getElementById('time-initiator').textContent = req.initiator || 'window';
    document.getElementById('time-type').textContent = (req.type || 'fetch').toUpperCase();
    document.getElementById('time-started').textContent = new Date(req.timestamp).toLocaleString();
  }

  function renderHeadersTable(tableId, headers) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!headers || Object.keys(headers).length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" style="color:#64748b;">No headers present</td></tr>';
      return;
    }
    Object.entries(headers).forEach(([k, v]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${k}</td><td>${v}</td>`;
      tbody.appendChild(tr);
    });
  }

  // ----------------------------------------------------
  // TypeScript Generator Engine
  // ----------------------------------------------------
  function generateTypeScriptTypes(req) {
    let out = `/**\n * Auto-generated TypeScript definitions by API Pulse Pro\n * Endpoint: ${req.pathname || req.url}\n * Method: ${req.method}\n */\n\n`;

    // Request Payload Interface
    if (req.requestBody?.parsed && typeof req.requestBody.parsed === 'object') {
      out += `export interface ${capitalize(inferName(req))}Payload ${inferTypeSchema(req.requestBody.parsed)}\n\n`;
    }

    // Response Interface
    if (req.responseBody?.parsed && typeof req.responseBody.parsed === 'object') {
      out += `export interface ${capitalize(inferName(req))}Response ${inferTypeSchema(req.responseBody.parsed)}\n\n`;
    } else {
      out += `export type ${capitalize(inferName(req))}Response = string;\n`;
    }

    return out;
  }

  function inferTypeSchema(obj, indent = '  ') {
    if (obj === null) return 'null';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'any[]';
      return `${inferTypeSchema(obj[0], indent)}[]`;
    }
    if (typeof obj === 'object') {
      let s = '{\n';
      Object.entries(obj).forEach(([k, v]) => {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
        const valType = inferTypeSchema(v, indent + '  ');
        s += `${indent}  ${safeKey}: ${valType};\n`;
      });
      s += `${indent}}`;
      return s;
    }
    return typeof obj;
  }

  function inferName(req) {
    try {
      const p = new URL(req.url).pathname.split('/').filter(Boolean);
      if (p.length) return p[p.length - 1].replace(/[^a-zA-Z0-9]/g, '');
    } catch (_) {}
    return 'Api';
  }

  function capitalize(s) {
    if (!s) return 'Api';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ----------------------------------------------------
  // Code Generators (cURL, fetch, Axios, Python, Go)
  // ----------------------------------------------------
  function renderCodeSnippet(req) {
    const el = document.getElementById('code-snippet-view');
    if (!el || !req) return;

    let code = '';
    const headers = req.requestHeaders || {};
    const bodyStr = req.requestBody?.raw || '';

    if (activeCodeLang === 'curl') {
      code = `curl -X ${req.method} "${req.url}"`;
      Object.entries(headers).forEach(([k, v]) => {
        if (['host', 'cookie'].includes(k.toLowerCase())) return;
        code += ` \\\n  -H "${k}: ${v.replace(/"/g, '\\"')}"`;
      });
      if (bodyStr && req.method !== 'GET') {
        code += ` \\\n  --data '${bodyStr.replace(/'/g, "'\\''")}'`;
      }
    } else if (activeCodeLang === 'fetch') {
      code = `const response = await fetch("${req.url}", {\n`;
      code += `  method: "${req.method}",\n`;
      code += `  headers: ${JSON.stringify(headers, null, 4)},\n`;
      if (bodyStr && req.method !== 'GET') {
        code += `  body: ${req.requestBody.isJson ? `JSON.stringify(${JSON.stringify(req.requestBody.parsed, null, 2)})` : JSON.stringify(bodyStr)},\n`;
      }
      code += `});\nconst data = await response.json();\nconsole.log(data);`;
    } else if (activeCodeLang === 'axios') {
      code = `import axios from 'axios';\n\nconst { data } = await axios({\n`;
      code += `  method: '${req.method.toLowerCase()}',\n`;
      code += `  url: '${req.url}',\n`;
      code += `  headers: ${JSON.stringify(headers, null, 4)},\n`;
      if (bodyStr && req.method !== 'GET') {
        code += `  data: ${req.requestBody.isJson ? JSON.stringify(req.requestBody.parsed, null, 2) : JSON.stringify(bodyStr)},\n`;
      }
      code += `});\nconsole.log(data);`;
    } else if (activeCodeLang === 'python') {
      code = `import requests\n\nurl = "${req.url}"\n`;
      code += `headers = ${JSON.stringify(headers, null, 4)}\n`;
      if (bodyStr && req.requestBody?.parsed) {
        code += `payload = ${JSON.stringify(req.requestBody.parsed, null, 4)}\n`;
        code += `response = requests.${req.method.toLowerCase()}(url, json=payload, headers=headers)\n`;
      } else {
        code += `response = requests.${req.method.toLowerCase()}(url, headers=headers)\n`;
      }
      code += `print(response.status_code, response.json())`;
    } else if (activeCodeLang === 'go') {
      code = `package main\n\nimport (\n\t"fmt"\n\t"net/http"\n\t"io"\n)\n\nfunc main() {\n`;
      code += `\treq, _ := http.NewRequest("${req.method}", "${req.url}", nil)\n`;
      Object.entries(headers).forEach(([k, v]) => {
        code += `\treq.Header.Set("${k}", "${v}")\n`;
      });
      code += `\tres, err := http.DefaultClient.Do(req)\n\tif err != nil { panic(err) }\n\tdefer res.Body.Close()\n\tbody, _ := io.ReadAll(res.Body)\n\tfmt.Println(string(body))\n}`;
    }

    el.textContent = code;
  }

  // ----------------------------------------------------
  // Security & Token Scanner + JWT Decoder
  // ----------------------------------------------------
  function scanSecurityTokens(req) {
    const listEl = document.getElementById('tokens-detected-list');
    const jwtCard = document.getElementById('jwt-card');
    listEl.innerHTML = '';
    jwtCard.style.display = 'none';

    let foundTokens = [];

    // Check Headers
    if (req.requestHeaders) {
      Object.entries(req.requestHeaders).forEach(([k, v]) => {
        if (k.toLowerCase() === 'authorization') {
          foundTokens.push({ type: 'Authorization Header', value: v });
          if (v.toLowerCase().startsWith('bearer ey')) {
            decodeJwt(v.replace(/^Bearer\s+/i, ''));
          }
        } else if (k.toLowerCase().includes('key') || k.toLowerCase().includes('token')) {
          foundTokens.push({ type: `Header: ${k}`, value: v });
        }
      });
    }

    // Check Response Body for JWT or API keys
    const rawRes = req.responseBody?.raw || '';
    const jwtMatch = rawRes.match(/eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+/);
    if (jwtMatch) {
      decodeJwt(jwtMatch[0]);
      foundTokens.push({ type: 'JWT in Response Body', value: jwtMatch[0] });
    }

    if (foundTokens.length === 0) {
      listEl.innerHTML = '<p class="text-muted">No authorization tokens or secrets detected in this request.</p>';
    } else {
      foundTokens.forEach(t => {
        const item = document.createElement('div');
        item.className = 'token-item';
        item.innerHTML = `<strong>${t.type}:</strong> <span>${t.value.slice(0, 40)}...</span>`;
        listEl.appendChild(item);
      });
    }
  }

  function decodeJwt(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return;

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      const jwtCard = document.getElementById('jwt-card');
      const headerBox = document.getElementById('jwt-header-box');
      const payloadBox = document.getElementById('jwt-payload-box');
      const badge = document.getElementById('jwt-exp-badge');

      jwtCard.style.display = 'block';
      headerBox.textContent = JSON.stringify(header, null, 2);
      payloadBox.textContent = JSON.stringify(payload, null, 2);

      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        if (expDate < now) {
          badge.textContent = `Expired at ${expDate.toLocaleTimeString()}`;
          badge.style.background = 'rgba(239, 68, 68, 0.2)';
          badge.style.color = '#f87171';
        } else {
          badge.textContent = `Valid until ${expDate.toLocaleTimeString()}`;
          badge.style.background = 'rgba(16, 185, 129, 0.2)';
          badge.style.color = '#34d399';
        }
      } else {
        badge.textContent = 'No Expiration';
      }
    } catch (_) {}
  }

  // ----------------------------------------------------
  // Replay Execution (In Page Context vs Direct Fetch)
  // ----------------------------------------------------
  async function executeReplay(inPageContext) {
    const url = document.getElementById('replay-url').value;
    const method = document.getElementById('replay-method').value;
    const bodyText = document.getElementById('replay-body-input').value;
    const headersRaw = document.getElementById('replay-headers-input').value;
    const outputView = document.getElementById('replay-output-view');
    const statusLabel = document.getElementById('replay-status-result');

    const headers = {};
    headersRaw.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        headers[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
    });

    statusLabel.textContent = 'Executing...';
    outputView.textContent = `[Sending ${method} ${url}...]`;

    const t0 = performance.now();

    if (inPageContext && activeTabId) {
      // Execute in page context via scripting / custom event
      chrome.tabs.sendMessage(activeTabId, {
        type: 'REPLAY_REQUEST',
        payload: { url, method, headers, body: bodyText }
      }, (res) => {
        if (chrome.runtime.lastError || !res) {
          // Fallback to direct fetch
          executeDirectFetch(url, method, headers, bodyText, t0);
          return;
        }
        const dur = res.duration || Math.round(performance.now() - t0);
        statusLabel.textContent = `${res.status || 200} ${res.statusText || 'OK'} (${dur}ms • Page Context)`;
        statusLabel.style.color = (res.status >= 400 || res.status === 0) ? '#f87171' : '#34d399';
        outputView.textContent = res.parsed ? JSON.stringify(res.parsed, null, 2) : (res.body || res.error || '(Empty response)');
      });
    } else {
      await executeDirectFetch(url, method, headers, bodyText, t0);
    }
  }

  async function executeDirectFetch(url, method, headers, bodyText, t0) {
    const outputView = document.getElementById('replay-output-view');
    const statusLabel = document.getElementById('replay-status-result');

    try {
      const opts = { method, headers };
      if (bodyText && method !== 'GET') opts.body = bodyText;

      const res = await fetch(url, opts);
      const dur = Math.round(performance.now() - t0);
      const text = await res.text();

      let parsed = null;
      try { parsed = JSON.parse(text); } catch (_) {}

      statusLabel.textContent = `${res.status} ${res.statusText} (${dur}ms • Direct Fetch)`;
      statusLabel.style.color = res.ok ? '#34d399' : '#f87171';

      outputView.textContent = parsed ? JSON.stringify(parsed, null, 2) : text;
    } catch (err) {
      statusLabel.textContent = 'Execution Failed';
      statusLabel.style.color = '#f87171';
      outputView.textContent = `Error: ${err.message}`;
    }
  }

  // ----------------------------------------------------
  // Mock Manager
  // ----------------------------------------------------
  function openMockModal(initialReq) {
    const modal = document.getElementById('mock-modal');
    modal.style.display = 'flex';
    if (initialReq) {
      addMockRuleFromReq(initialReq);
    } else {
      renderMockRulesList();
    }
  }

  function addMockRuleFromReq(req) {
    let pattern = req.pathname || req.url;
    try { pattern = new URL(req.url).pathname; } catch (_) {}

    const newRule = {
      id: 'mock_' + Date.now(),
      enabled: true,
      urlPattern: pattern,
      method: req.method,
      statusCode: req.status || 200,
      delayMs: 150,
      responseBody: req.responseBody?.raw || '{"mocked": true}'
    };

    mockRules.unshift(newRule);
    saveMockRules();
    renderMockRulesList();
  }

  function renderMockRulesList() {
    const container = document.getElementById('mock-rules-container');
    container.innerHTML = '';

    if (mockRules.length === 0) {
      container.innerHTML = '<p class="text-muted" style="padding:12px 0;">No mock rules active. Click "+ Add New Mock Rule" below to create your first stub!</p>';
      return;
    }

    mockRules.forEach((rule, idx) => {
      const card = document.createElement('div');
      card.className = 'mock-rule-card';
      card.innerHTML = `
        <div class="mock-rule-header">
          <label class="checkbox-label">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} class="mock-enable-check">
            <b>Rule #${idx + 1} ${rule.enabled ? '<span style="color:#34d399;">(Active)</span>' : '<span style="color:#94a3b8;">(Disabled)</span>'}</b>
          </label>
          <button class="btn-tool-sm btn-danger" data-del="${idx}">Delete Rule</button>
        </div>
        <div class="mock-rule-inputs-row">
          <select class="mock-method-select">
            <option value="ALL" ${rule.method === 'ALL' ? 'selected' : ''}>ALL Methods</option>
            <option value="POST" ${rule.method === 'POST' ? 'selected' : ''}>POST</option>
            <option value="GET" ${rule.method === 'GET' ? 'selected' : ''}>GET</option>
            <option value="PUT" ${rule.method === 'PUT' ? 'selected' : ''}>PUT</option>
            <option value="PATCH" ${rule.method === 'PATCH' ? 'selected' : ''}>PATCH</option>
            <option value="DELETE" ${rule.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
          </select>
          <input type="text" class="mock-pattern-input" value="${rule.urlPattern || ''}" placeholder="Pattern: /api/v1/* or regex">
          <input type="number" class="mock-status-input" value="${rule.statusCode || 200}" placeholder="Status" title="HTTP Status Code">
          <input type="number" class="mock-delay-input" value="${rule.delayMs || 0}" placeholder="Delay ms" title="Delay (ms)">
        </div>
        <div>
          <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px;">Mock Response Body (JSON or text):</label>
          <textarea class="mock-rule-body-area">${rule.responseBody || ''}</textarea>
        </div>
      `;

      card.querySelector('.mock-enable-check').addEventListener('change', (e) => {
        mockRules[idx].enabled = e.target.checked;
        saveMockRules();
        renderMockRulesList();
      });

      card.querySelector('.mock-method-select').addEventListener('change', (e) => {
        mockRules[idx].method = e.target.value;
        saveMockRules();
      });

      card.querySelector('.mock-pattern-input').addEventListener('input', (e) => {
        mockRules[idx].urlPattern = e.target.value;
        saveMockRules();
      });

      card.querySelector('.mock-status-input').addEventListener('input', (e) => {
        mockRules[idx].statusCode = parseInt(e.target.value, 10) || 200;
        saveMockRules();
      });

      card.querySelector('.mock-delay-input').addEventListener('input', (e) => {
        mockRules[idx].delayMs = parseInt(e.target.value, 10) || 0;
        saveMockRules();
      });

      card.querySelector('.mock-rule-body-area').addEventListener('input', (e) => {
        mockRules[idx].responseBody = e.target.value;
        saveMockRules();
      });

      card.querySelector('[data-del]').addEventListener('click', () => {
        mockRules.splice(idx, 1);
        saveMockRules();
        renderMockRulesList();
      });

      container.appendChild(card);
    });
  }

  async function saveMockRules() {
    await StorageUtil.set({ apiPulseMockRules: mockRules });
    updateMockBadge();
  }

  // ----------------------------------------------------
  // JSON Diff Modal
  // ----------------------------------------------------
  function openDiffModal() {
    const modal = document.getElementById('diff-modal');
    modal.style.display = 'flex';

    const selA = document.getElementById('diff-select-a');
    const selB = document.getElementById('diff-select-b');
    selA.innerHTML = '';
    selB.innerHTML = '';

    if (allRequests.length === 0) {
      document.getElementById('diff-box-left').textContent = '// No requests captured yet. Trigger API calls on the page to compare responses!';
      document.getElementById('diff-box-right').textContent = '// No requests captured yet.';
      return;
    }

    allRequests.forEach(r => {
      const optA = document.createElement('option');
      optA.value = r.id;
      optA.textContent = `${r.method} ${r.pathname || r.url} (${r.status})`;
      selA.appendChild(optA);

      const optB = document.createElement('option');
      optB.value = r.id;
      optB.textContent = `${r.method} ${r.pathname || r.url} (${r.status})`;
      selB.appendChild(optB);
    });

    if (selB.options.length > 1) selB.selectedIndex = 1;

    renderDiffBoxes();
    selA.onchange = renderDiffBoxes;
    selB.onchange = renderDiffBoxes;
  }

  function renderDiffBoxes() {
    const idA = document.getElementById('diff-select-a').value;
    const idB = document.getElementById('diff-select-b').value;
    const reqA = allRequests.find(r => r.id === idA);
    const reqB = allRequests.find(r => r.id === idB);

    const boxA = document.getElementById('diff-box-left');
    const boxB = document.getElementById('diff-box-right');

    boxA.textContent = reqA?.responseBody?.parsed ? JSON.stringify(reqA.responseBody.parsed, null, 2) : (reqA?.responseBody?.raw || 'N/A');
    boxB.textContent = reqB?.responseBody?.parsed ? JSON.stringify(reqB.responseBody.parsed, null, 2) : (reqB?.responseBody?.raw || 'N/A');
  }

  // ----------------------------------------------------
  // Splitter Resizing
  // ----------------------------------------------------
  function setupSplitter() {
    const splitter = document.getElementById('workspace-splitter');
    const leftPanel = document.getElementById('stream-panel');
    let isResizing = false;

    splitter.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      function onMouseMove(moveEvent) {
        if (!isResizing) return;
        const newWidth = Math.max(300, Math.min(window.innerWidth - 300, moveEvent.clientX));
        leftPanel.style.width = `${newWidth}px`;
      }

      function onMouseUp() {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  // ----------------------------------------------------
  // Global Event Handlers
  // ----------------------------------------------------
  function setupEventHandlers() {
    // Recording toggle
    const btnRecord = document.getElementById('btn-toggle-record');
    btnRecord.addEventListener('click', () => {
      isRecording = !isRecording;
      btnRecord.classList.toggle('paused', !isRecording);
      document.getElementById('record-text').textContent = isRecording ? 'Recording' : 'Paused';
    });

    // Auto scroll checkbox
    document.getElementById('check-autoscroll').addEventListener('change', (e) => {
      autoScroll = e.target.checked;
    });

    // Clear all
    document.getElementById('btn-clear-all').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'CLEAR_TAB_REQUESTS', tabId: activeTabId }, () => {
        allRequests = [];
        selectedReqId = null;
        updateCounts();
        renderStreamList();
        document.getElementById('no-selection-pane').style.display = 'flex';
        document.getElementById('active-inspector-pane').style.display = 'none';
      });
    });

    // Search input
    document.getElementById('studio-search-input').addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderStreamList();
    });

    // Filter pills
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderStreamList();
      });
    });

    // Inspector Tabs
    document.querySelectorAll('.insp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.insp-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const targetId = `pane-${tab.dataset.tab}`;
        document.getElementById(targetId)?.classList.add('active');
      });
    });

    // Replay Subtabs
    document.querySelectorAll('.subtab').forEach(sub => {
      sub.addEventListener('click', () => {
        document.querySelectorAll('.subtab').forEach(s => s.classList.remove('active'));
        sub.classList.add('active');
        document.getElementById('replay-sub-body').style.display = sub.dataset.sub === 'body' ? 'flex' : 'none';
        document.getElementById('replay-sub-headers').style.display = sub.dataset.sub === 'headers' ? 'flex' : 'none';
      });
    });

    // Replay Action Buttons
    document.getElementById('btn-exec-replay').addEventListener('click', () => executeReplay(true));
    document.getElementById('btn-exec-direct-fetch').addEventListener('click', () => executeReplay(false));
    document.getElementById('btn-quick-replay').addEventListener('click', () => {
      document.querySelector('.insp-tab[data-tab="replay"]').click();
      executeReplay(true);
    });

    // Code Generator language switcher
    document.querySelectorAll('.lang-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.lang-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCodeLang = pill.dataset.lang;
        const req = allRequests.find(r => r.id === selectedReqId);
        if (req) renderCodeSnippet(req);
      });
    });

    // Copy Code Buttons
    document.getElementById('btn-copy-snippet').addEventListener('click', () => {
      copyToClipboard(document.getElementById('code-snippet-view').textContent, 'btn-copy-snippet');
    });
    document.getElementById('btn-copy-ts').addEventListener('click', () => {
      copyToClipboard(document.getElementById('code-ts-types').textContent, 'btn-copy-ts');
    });
    document.getElementById('btn-copy-resp').addEventListener('click', () => {
      copyToClipboard(document.getElementById('code-response-body').textContent, 'btn-copy-resp');
    });
    document.getElementById('btn-copy-req').addEventListener('click', () => {
      copyToClipboard(document.getElementById('code-payload-body').textContent, 'btn-copy-req');
    });
    document.getElementById('btn-copy-url').addEventListener('click', () => {
      copyToClipboard(document.getElementById('insp-full-url').value, 'btn-copy-url');
    });
    document.getElementById('btn-quick-curl').addEventListener('click', () => {
      const req = allRequests.find(r => r.id === selectedReqId);
      if (req) {
        activeCodeLang = 'curl';
        renderCodeSnippet(req);
        copyToClipboard(document.getElementById('code-snippet-view').textContent, 'btn-quick-curl');
      }
    });

    // Mock Engine Buttons
    document.getElementById('btn-mock-manager').addEventListener('click', () => openMockModal());
    document.getElementById('btn-create-mock').addEventListener('click', () => {
      const req = allRequests.find(r => r.id === selectedReqId);
      if (req) openMockModal(req);
    });
    document.getElementById('btn-close-mock-modal').addEventListener('click', () => {
      document.getElementById('mock-modal').style.display = 'none';
    });
    document.getElementById('btn-add-mock-rule')?.addEventListener('click', () => {
      const newRule = {
        id: 'mock_' + Date.now(),
        enabled: true,
        urlPattern: '/api/v1/*',
        method: 'ALL',
        statusCode: 200,
        delayMs: 150,
        responseBody: JSON.stringify({ message: 'Synthetic response from API Pulse Pro', success: true }, null, 2)
      };
      mockRules.push(newRule);
      saveMockRules();
      renderMockRulesList();
    });

    // New Custom Request Button
    document.getElementById('btn-new-custom-req')?.addEventListener('click', () => {
      document.getElementById('no-selection-pane').style.display = 'none';
      document.getElementById('active-inspector-pane').style.display = 'flex';
      document.querySelector('.insp-tab[data-tab="replay"]')?.click();
      document.getElementById('replay-method').value = 'POST';
      document.getElementById('replay-url').value = 'https://httpbin.org/post';
      document.getElementById('replay-body-input').value = JSON.stringify({ message: "Test custom request", timestamp: Date.now() }, null, 2);
      document.getElementById('replay-headers-input').value = 'Content-Type: application/json\n';
      document.getElementById('replay-url').focus();
    });

    // Pin Active Request in Header
    document.getElementById('btn-pin-active')?.addEventListener('click', () => {
      if (!selectedReqId) return;
      if (pinnedIds.has(selectedReqId)) pinnedIds.delete(selectedReqId);
      else pinnedIds.add(selectedReqId);
      try { localStorage.setItem('apiPulsePinnedIds', JSON.stringify([...pinnedIds])); } catch (_) {}
      renderStreamList();
      const isPin = pinnedIds.has(selectedReqId);
      document.getElementById('btn-pin-active').textContent = isPin ? '★ Pinned' : '★ Pin';
    });

    // Prettify JSON Buttons
    document.getElementById('btn-format-resp')?.addEventListener('click', () => {
      const el = document.getElementById('code-response-body');
      try {
        const parsed = JSON.parse(el.textContent);
        el.textContent = JSON.stringify(parsed, null, 2);
      } catch (_) {}
    });
    document.getElementById('btn-format-req')?.addEventListener('click', () => {
      const el = document.getElementById('code-payload-body');
      try {
        const parsed = JSON.parse(el.textContent);
        el.textContent = JSON.stringify(parsed, null, 2);
      } catch (_) {}
    });

    // In-body search filtering
    document.getElementById('search-resp-body')?.addEventListener('input', (e) => {
      filterCodeView('code-response-body', e.target.value);
    });
    document.getElementById('search-req-body')?.addEventListener('input', (e) => {
      filterCodeView('code-payload-body', e.target.value);
    });

    // Copy Raw Headers Buttons
    document.getElementById('btn-copy-req-headers')?.addEventListener('click', () => {
      const req = allRequests.find(r => r.id === selectedReqId);
      if (req?.requestHeaders) {
        const text = Object.entries(req.requestHeaders).map(([k, v]) => `${k}: ${v}`).join('\n');
        copyToClipboard(text || '(No headers)', 'btn-copy-req-headers');
      }
    });
    document.getElementById('btn-copy-res-headers')?.addEventListener('click', () => {
      const req = allRequests.find(r => r.id === selectedReqId);
      if (req?.responseHeaders) {
        const text = Object.entries(req.responseHeaders).map(([k, v]) => `${k}: ${v}`).join('\n');
        copyToClipboard(text || '(No headers)', 'btn-copy-res-headers');
      }
    });

    // Preserve Log toggle
    StorageUtil.get(['apiPulsePreserveLog']).then(data => {
      if (data.apiPulsePreserveLog) {
        const chk = document.getElementById('check-preserve-log');
        if (chk) chk.checked = true;
      }
    });
    document.getElementById('check-preserve-log')?.addEventListener('change', (e) => {
      StorageUtil.set({ apiPulsePreserveLog: e.target.checked });
    });

    // Diff Modal Buttons
    document.getElementById('btn-diff-modal').addEventListener('click', openDiffModal);
    document.getElementById('btn-close-diff-modal').addEventListener('click', () => {
      document.getElementById('diff-modal').style.display = 'none';
    });

    // Export HAR/JSON
    document.getElementById('btn-export-menu').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(allRequests, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-pulse-studio-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('studio-search-input').focus();
      }
    });
  }

  function filterCodeView(viewId, term) {
    const el = document.getElementById(viewId);
    if (!el) return;
    if (!el._origText) el._origText = el.textContent;
    if (!term) {
      el.textContent = el._origText;
      return;
    }
    const lines = el._origText.split('\n');
    const matched = lines.filter(l => l.toLowerCase().includes(term.toLowerCase()));
    el.textContent = matched.length ? matched.join('\n') : `// No lines matching "${term}"`;
  }

  function copyToClipboard(text, btnId) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById(btnId);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1200);
      }
    });
  }
})();
