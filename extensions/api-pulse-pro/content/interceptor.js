// API Pulse Pro - Main World Network Interceptor
// Injected into page context (world: MAIN) to monitor fetch & XMLHttpRequest

(function () {
  if (window.__API_PULSE_INTERCEPTOR_LOADED__) return;
  window.__API_PULSE_INTERCEPTOR_LOADED__ = true;

  // Active Mock Rules storage in memory
  window.__API_PULSE_MOCKS__ = window.__API_PULSE_MOCKS__ || [];

  function generateId() {
    return 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function getInitiatorInfo() {
    try {
      const stack = new Error().stack || '';
      const lines = stack.split('\n');
      // Skip error and interceptor frames
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.includes('interceptor.js') && !line.includes('API_PULSE')) {
          const match = line.match(/(https?:\/\/[^\s\)]+|at\s+[^\s]+)/);
          return match ? match[0].replace(/^at\s+/, '') : line;
        }
      }
    } catch (_) {}
    return 'page-script';
  }

  function parseHeaders(headerInput) {
    const headers = {};
    if (!headerInput) return headers;
    if (headerInput instanceof Headers) {
      headerInput.forEach((val, key) => {
        headers[key.toLowerCase()] = val;
      });
    } else if (Array.isArray(headerInput)) {
      headerInput.forEach(([k, v]) => {
        if (k) headers[k.toLowerCase()] = String(v);
      });
    } else if (typeof headerInput === 'object') {
      Object.entries(headerInput).forEach(([k, v]) => {
        if (k) headers[k.toLowerCase()] = String(v);
      });
    }
    return headers;
  }

  function parseRawHeaders(raw) {
    const headers = {};
    if (!raw || typeof raw !== 'string') return headers;
    const lines = raw.trim().split(/[\r\n]+/);
    lines.forEach(line => {
      const parts = line.split(': ');
      const key = parts.shift();
      const val = parts.join(': ');
      if (key) headers[key.toLowerCase()] = val;
    });
    return headers;
  }

  function serializeBody(body) {
    if (body === null || body === undefined) return null;
    if (typeof body === 'string') {
      try {
        return { isJson: true, raw: body, parsed: JSON.parse(body) };
      } catch (_) {
        return { isJson: false, raw: body };
      }
    }
    if (body instanceof URLSearchParams) {
      const obj = {};
      body.forEach((val, key) => { obj[key] = val; });
      return { isJson: false, isUrlEncoded: true, raw: body.toString(), parsed: obj };
    }
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      const obj = {};
      try {
        body.forEach((val, key) => {
          if (typeof val === 'object' && val.name) {
            obj[key] = `[File: ${val.name} (${val.size || 0} bytes, ${val.type || 'application/octet-stream'})]`;
          } else {
            obj[key] = String(val);
          }
        });
      } catch (_) {}
      return { isFormData: true, parsed: obj, raw: JSON.stringify(obj) };
    }
    if (typeof Blob !== 'undefined' && body instanceof Blob) {
      return { isBlob: true, raw: `[Blob: ${body.size} bytes, type=${body.type}]` };
    }
    try {
      return { isJson: true, raw: JSON.stringify(body), parsed: body };
    } catch (_) {
      return { raw: String(body) };
    }
  }

  function detectGraphQL(url, body) {
    const isUrlGql = url.toLowerCase().includes('/graphql');
    let parsedBody = null;
    if (body && typeof body === 'object') {
      parsedBody = body.parsed || (body.raw ? (() => { try { return JSON.parse(body.raw); } catch (_) { return null; } })() : null);
    }
    if (parsedBody && (parsedBody.query || parsedBody.mutation)) {
      return {
        isGraphQL: true,
        operationName: parsedBody.operationName || 'AnonymousOperation',
        query: parsedBody.query || parsedBody.mutation,
        variables: parsedBody.variables || {}
      };
    }
    if (isUrlGql) {
      return { isGraphQL: true, operationName: 'GraphQL Request' };
    }
    return { isGraphQL: false };
  }

  function findMatchingMock(url, method) {
    if (!window.__API_PULSE_MOCKS__ || !window.__API_PULSE_MOCKS__.length) return null;
    const normMethod = (method || 'GET').toUpperCase();
    let pathname = '';
    try { pathname = new URL(url, window.location.href).pathname; } catch (_) { pathname = url; }

    for (const rule of window.__API_PULSE_MOCKS__) {
      if (!rule.enabled) continue;
      if (rule.method && rule.method !== 'ALL' && rule.method.toUpperCase() !== normMethod) continue;
      
      let matched = false;
      try {
        if (rule.isRegex) {
          const re = new RegExp(rule.urlPattern, 'i');
          matched = re.test(url) || re.test(pathname);
        } else {
          // Wildcard matching: support *
          const esc = rule.urlPattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
          const re = new RegExp(esc, 'i');
          matched = re.test(url) || re.test(pathname);
        }
      } catch (_) {
        matched = url.includes(rule.urlPattern) || pathname.includes(rule.urlPattern);
      }
      if (matched) return rule;
    }
    return null;
  }

  function dispatchCapture(detail) {
    try {
      window.dispatchEvent(new CustomEvent('__api_pulse_captured__', { detail }));
    } catch (e) {
      console.warn('[API Pulse] Error dispatching event:', e);
    }
  }

  // ----------------------------------------------------
  // 1. Monkey-Patch window.fetch
  // ----------------------------------------------------
  const originalFetch = window.fetch;
  window.fetch = async function (resource, init) {
    const reqId = generateId();
    const startTime = performance.now();
    const timestamp = Date.now();
    const initiator = getInitiatorInfo();

    let url = '';
    let method = 'GET';
    let requestHeaders = {};
    let requestBody = null;

    if (typeof resource === 'string') {
      url = resource;
    } else if (resource instanceof URL) {
      url = resource.toString();
    } else if (resource instanceof Request) {
      url = resource.url;
      method = resource.method || 'GET';
      requestHeaders = parseHeaders(resource.headers);
    }

    if (init) {
      if (init.method) method = init.method.toUpperCase();
      if (init.headers) requestHeaders = { ...requestHeaders, ...parseHeaders(init.headers) };
      if (init.body !== undefined) requestBody = serializeBody(init.body);
    }

    // Resolve full URL
    let fullUrl = url;
    try {
      fullUrl = new URL(url, window.location.href).href;
    } catch (_) {}

    const gqlInfo = detectGraphQL(fullUrl, requestBody);

    // Check Mock Rule
    const mockRule = findMatchingMock(fullUrl, method);
    if (mockRule) {
      const delay = Math.max(0, parseInt(mockRule.delayMs, 10) || 0);
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockStatus = parseInt(mockRule.statusCode, 10) || 200;
          const mockBodyText = typeof mockRule.responseBody === 'string'
            ? mockRule.responseBody
            : JSON.stringify(mockRule.responseBody || {});
          
          let parsedMockBody = null;
          try { parsedMockBody = JSON.parse(mockBodyText); } catch (_) { parsedMockBody = mockBodyText; }

          const mockHeaders = {
            'content-type': 'application/json; charset=utf-8',
            'x-api-pulse-mocked': 'true',
            ...(mockRule.headers || {})
          };

          const duration = Math.round(performance.now() - startTime);

          dispatchCapture({
            id: reqId,
            type: 'fetch',
            mocked: true,
            method,
            url: fullUrl,
            pathname: new URL(fullUrl, window.location.href).pathname,
            timestamp,
            duration,
            status: mockStatus,
            statusText: mockStatus >= 200 && mockStatus < 300 ? 'OK (Mocked)' : 'Mocked Response',
            initiator,
            requestHeaders,
            requestBody,
            responseHeaders: mockHeaders,
            responseBody: {
              raw: mockBodyText,
              parsed: parsedMockBody,
              sizeBytes: mockBodyText.length
            },
            graphql: gqlInfo
          });

          const syntheticResponse = new Response(mockBodyText, {
            status: mockStatus,
            statusText: 'Mocked by API Pulse',
            headers: new Headers(mockHeaders)
          });
          resolve(syntheticResponse);
        }, delay);
      });
    }

    // Normal Network Fetch
    try {
      const response = await originalFetch.apply(this, arguments);
      const duration = Math.round(performance.now() - startTime);
      const responseClone = response.clone();

      // Read response body asynchronously without blocking user code
      responseClone.text().then(text => {
        let parsed = null;
        let isJson = false;
        try {
          parsed = JSON.parse(text);
          isJson = true;
        } catch (_) {}

        const resHeaders = parseHeaders(response.headers);
        dispatchCapture({
          id: reqId,
          type: 'fetch',
          mocked: false,
          method,
          url: fullUrl,
          pathname: new URL(fullUrl, window.location.href).pathname,
          timestamp,
          duration,
          status: response.status,
          statusText: response.statusText,
          initiator,
          requestHeaders,
          requestBody,
          responseHeaders: resHeaders,
          responseBody: {
            raw: text.length > 500000 ? text.slice(0, 500000) + '... [TRUNCATED]' : text,
            parsed,
            isJson,
            sizeBytes: text.length
          },
          graphql: gqlInfo
        });
      }).catch(err => {
        const resHeaders = parseHeaders(response.headers);
        dispatchCapture({
          id: reqId,
          type: 'fetch',
          mocked: false,
          method,
          url: fullUrl,
          pathname: new URL(fullUrl, window.location.href).pathname,
          timestamp,
          duration,
          status: response.status,
          statusText: response.statusText,
          initiator,
          requestHeaders,
          requestBody,
          responseHeaders: resHeaders,
          responseBody: {
            raw: '[Binary or Unreadable Stream]',
            sizeBytes: 0
          },
          graphql: gqlInfo
        });
      });

      return response;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      dispatchCapture({
        id: reqId,
        type: 'fetch',
        mocked: false,
        method,
        url: fullUrl,
        pathname: new URL(fullUrl, window.location.href).pathname,
        timestamp,
        duration,
        status: 0,
        statusText: error.message || 'Network Failed / Aborted',
        isError: true,
        initiator,
        requestHeaders,
        requestBody,
        responseHeaders: {},
        responseBody: { raw: error.stack || error.message || 'Network Error', isError: true },
        graphql: gqlInfo
      });
      throw error;
    }
  };

  // ----------------------------------------------------
  // 2. Monkey-Patch window.XMLHttpRequest
  // ----------------------------------------------------
  const XHR = window.XMLHttpRequest;
  const originalOpen = XHR.prototype.open;
  const originalSend = XHR.prototype.send;
  const originalSetRequestHeader = XHR.prototype.setRequestHeader;

  XHR.prototype.open = function (method, url, async, user, password) {
    this.__api_pulse_meta = {
      id: generateId(),
      method: (method || 'GET').toUpperCase(),
      url: String(url),
      fullUrl: (() => { try { return new URL(url, window.location.href).href; } catch (_) { return String(url); } })(),
      requestHeaders: {},
      initiator: getInitiatorInfo()
    };
    return originalOpen.apply(this, arguments);
  };

  XHR.prototype.setRequestHeader = function (header, value) {
    if (this.__api_pulse_meta) {
      this.__api_pulse_meta.requestHeaders[header.toLowerCase()] = String(value);
    }
    return originalSetRequestHeader.apply(this, arguments);
  };

  XHR.prototype.send = function (body) {
    const meta = this.__api_pulse_meta;
    if (!meta) {
      return originalSend.apply(this, arguments);
    }

    meta.requestBody = serializeBody(body);
    meta.startTime = performance.now();
    meta.timestamp = Date.now();
    meta.graphql = detectGraphQL(meta.fullUrl, meta.requestBody);

    // Check Mock Rule for XHR
    const mockRule = findMatchingMock(meta.fullUrl, meta.method);
    if (mockRule) {
      const delay = Math.max(0, parseInt(mockRule.delayMs, 10) || 0);
      const mockStatus = parseInt(mockRule.statusCode, 10) || 200;
      const mockBodyText = typeof mockRule.responseBody === 'string'
        ? mockRule.responseBody
        : JSON.stringify(mockRule.responseBody || {});

      setTimeout(() => {
        const duration = Math.round(performance.now() - meta.startTime);
        let parsed = null;
        try { parsed = JSON.parse(mockBodyText); } catch (_) { parsed = mockBodyText; }

        dispatchCapture({
          id: meta.id,
          type: 'xhr',
          mocked: true,
          method: meta.method,
          url: meta.fullUrl,
          pathname: new URL(meta.fullUrl, window.location.href).pathname,
          timestamp: meta.timestamp,
          duration,
          status: mockStatus,
          statusText: 'OK (Mocked XHR)',
          initiator: meta.initiator,
          requestHeaders: meta.requestHeaders,
          requestBody: meta.requestBody,
          responseHeaders: { 'content-type': 'application/json', 'x-api-pulse-mocked': 'true' },
          responseBody: {
            raw: mockBodyText,
            parsed,
            sizeBytes: mockBodyText.length
          },
          graphql: meta.graphql
        });

        // Synthetic XHR completion
        Object.defineProperty(this, 'readyState', { value: 4, writable: true });
        Object.defineProperty(this, 'status', { value: mockStatus, writable: true });
        Object.defineProperty(this, 'statusText', { value: 'OK (Mocked)', writable: true });
        Object.defineProperty(this, 'responseText', { value: mockBodyText, writable: true });
        Object.defineProperty(this, 'response', { value: mockBodyText, writable: true });

        this.dispatchEvent(new Event('readystatechange'));
        this.dispatchEvent(new Event('load'));
        this.dispatchEvent(new Event('loadend'));
      }, delay);
      return;
    }

    // Normal XHR execution
    this.addEventListener('loadend', () => {
      try {
        const duration = Math.round(performance.now() - meta.startTime);
        const rawHeaders = this.getAllResponseHeaders() || '';
        const resHeaders = parseRawHeaders(rawHeaders);
        const text = typeof this.responseText === 'string' ? this.responseText : '';

        let parsed = null;
        let isJson = false;
        try {
          parsed = JSON.parse(text);
          isJson = true;
        } catch (_) {}

        dispatchCapture({
          id: meta.id,
          type: 'xhr',
          mocked: false,
          method: meta.method,
          url: meta.fullUrl,
          pathname: new URL(meta.fullUrl, window.location.href).pathname,
          timestamp: meta.timestamp,
          duration,
          status: this.status,
          statusText: this.statusText,
          isError: this.status === 0 || this.status >= 400,
          initiator: meta.initiator,
          requestHeaders: meta.requestHeaders,
          requestBody: meta.requestBody,
          responseHeaders: resHeaders,
          responseBody: {
            raw: text.length > 500000 ? text.slice(0, 500000) + '... [TRUNCATED]' : text,
            parsed,
            isJson,
            sizeBytes: text.length
          },
          graphql: meta.graphql
        });
      } catch (err) {
        console.warn('[API Pulse] Error capturing XHR:', err);
      }
    });

    return originalSend.apply(this, arguments);
  };

  // ----------------------------------------------------
  // 3. Page-Context Replay Handler
  // ----------------------------------------------------
  window.addEventListener('__api_pulse_replay_exec__', async (e) => {
    const payload = e.detail;
    if (!payload) return;
    const { replayId, url, method, headers, body } = payload;
    const t0 = performance.now();

    try {
      const options = {
        method: method || 'GET',
        headers: headers || {},
        credentials: 'include' // Inherit active page cookies and session!
      };
      if (body && method !== 'GET' && method !== 'HEAD') {
        options.body = typeof body === 'object' ? JSON.stringify(body) : body;
      }

      const res = await originalFetch(url, options);
      const duration = Math.round(performance.now() - t0);
      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (_) {}

      window.dispatchEvent(new CustomEvent('__api_pulse_replay_result__', {
        detail: {
          replayId,
          success: true,
          status: res.status,
          statusText: res.statusText,
          duration,
          headers: parseHeaders(res.headers),
          body: text,
          parsed
        }
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('__api_pulse_replay_result__', {
        detail: {
          replayId,
          success: false,
          duration: Math.round(performance.now() - t0),
          error: err.message || 'Replay Failed'
        }
      }));
    }
  });

  // ----------------------------------------------------
  // 4. Mock Rules Synchronization
  // ----------------------------------------------------
  window.addEventListener('__api_pulse_sync_mocks__', (e) => {
    if (e.detail && Array.isArray(e.detail.rules)) {
      window.__API_PULSE_MOCKS__ = e.detail.rules;
    }
  });

  // Announce ready
  window.dispatchEvent(new CustomEvent('__api_pulse_ready__'));
})();
