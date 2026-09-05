// Link Inspector Extension - Background Service Worker (Manifest V3)

// Initialize extension settings and context menus on installation
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.local.set({
    inspectorEnabled: true,
    highlightEnabled: false,
    autoCheckStatus: true,
    highlightCategories: {
      internal: true,
      external: true,
      nofollow: true,
      broken: true
    },
    pointerStyle: 'default'
  });

  // Create context menu items
  chrome.contextMenus.create({
    id: 'inspect-link',
    title: 'Inspect Link Details',
    contexts: ['link']
  });

  chrome.contextMenus.create({
    id: 'toggle-highlight',
    title: 'Toggle Visual Link Highlights',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'scan-page-links',
    title: 'Scan All Links for Errors',
    contexts: ['page']
  });
});

// Global Keyboard Shortcut Command Listener
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-inspector') {
    const res = await chrome.storage.local.get(['inspectorEnabled']);
    const newState = res.inspectorEnabled === false ? true : false;
    await chrome.storage.local.set({ inspectorEnabled: newState });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'SET_INSPECTOR_STATE',
        enabled: newState
      });
    }
  }
});

// Context Menu Click Listener
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'inspect-link') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'INSPECT_SINGLE_LINK',
      linkUrl: info.linkUrl
    });
  } else if (info.menuItemId === 'toggle-highlight') {
    chrome.storage.local.get(['highlightEnabled'], (res) => {
      const newState = !res.highlightEnabled;
      chrome.storage.local.set({ highlightEnabled: newState });
      chrome.tabs.sendMessage(tab.id, {
        action: 'SET_HIGHLIGHT_STATE',
        enabled: newState
      });
    });
  } else if (info.menuItemId === 'scan-page-links') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'TRIGGER_FULL_SCAN'
    });
  }
});

// Cache for URL status checks to avoid redundant HTTP requests
const statusCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Handle messaging from Content Scripts & Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'CHECK_LINK_STATUS') {
    handleLinkStatusCheck(message.url)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ status: 0, statusText: err.message || 'Error', ok: false }));
    return true; // Keep message channel open for async response
  }

  if (message.action === 'BATCH_CHECK_STATUS') {
    handleBatchStatusCheck(message.urls)
      .then((results) => sendResponse(results))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

/**
 * Check HTTP status of a single URL via background fetch
 */
async function handleLinkStatusCheck(url) {
  if (!url || url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
    return { status: 200, statusText: 'Special Scheme', ok: true, isSpecial: true };
  }

  const cached = statusCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Try HEAD request first for speed
    let response;
    try {
      response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        cache: 'no-cache'
      });
    } catch (headError) {
      // If HEAD is blocked or fails, retry with GET
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), 6000);
      response = await fetch(url, {
        method: 'GET',
        signal: getController.signal,
        redirect: 'follow',
        cache: 'no-cache'
      });
      clearTimeout(getTimeoutId);
    }
    clearTimeout(timeoutId);

    const latencyMs = Math.round(performance.now() - startTime);
    const data = {
      status: response.status,
      statusText: response.statusText || getStatusMessage(response.status),
      ok: response.ok,
      latencyMs: latencyMs,
      redirected: response.redirected,
      finalUrl: response.url
    };

    statusCache.set(url, { timestamp: Date.now(), data });
    return data;
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    let statusText = 'Network Error';
    if (error.name === 'AbortError') {
      statusText = 'Timeout (6s)';
    } else if (error.message && error.message.includes('Failed to fetch')) {
      statusText = 'CORS / Connection Refused';
    }

    const data = {
      status: 0,
      statusText: statusText,
      ok: false,
      latencyMs: latencyMs
    };
    statusCache.set(url, { timestamp: Date.now(), data });
    return data;
  }
}

/**
 * Perform batch checks for multiple URLs concurrently with concurrency limit
 */
async function handleBatchStatusCheck(urls) {
  const uniqueUrls = Array.from(new Set(urls));
  const results = {};
  const CONCURRENCY_LIMIT = 5;

  for (let i = 0; i < uniqueUrls.length; i += CONCURRENCY_LIMIT) {
    const chunk = uniqueUrls.slice(i, i + CONCURRENCY_LIMIT);
    const chunkPromises = chunk.map(async (url) => {
      results[url] = await handleLinkStatusCheck(url);
    });
    await Promise.all(chunkPromises);
  }

  return results;
}

/**
 * Fallback status message lookup
 */
function getStatusMessage(code) {
  const messages = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified', 307: 'Temporary Redirect', 308: 'Permanent Redirect',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 429: 'Too Many Requests',
    500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout'
  };
  return messages[code] || 'Unknown Status';
}
