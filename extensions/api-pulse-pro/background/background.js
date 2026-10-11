// API Pulse Pro - Service Worker Background Script (Manifest V3)

const tabRequests = new Map();
const MAX_REQUESTS_PER_TAB = 500;

// Listen for captured requests from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  if (message.type === 'REQ_CAPTURED' && tabId !== undefined) {
    if (!tabRequests.has(tabId)) {
      tabRequests.set(tabId, []);
    }
    const list = tabRequests.get(tabId);
    list.unshift(message.request);
    if (list.length > MAX_REQUESTS_PER_TAB) {
      list.pop();
    }

    updateBadge(tabId);
    return true;
  }

  if (message.type === 'GET_TAB_REQUESTS') {
    const targetTabId = message.tabId || tabId;
    const requests = tabRequests.get(targetTabId) || [];
    sendResponse({ requests });
    return true;
  }

  if (message.type === 'CLEAR_TAB_REQUESTS') {
    const targetTabId = message.tabId || tabId;
    if (tabRequests.has(targetTabId)) {
      tabRequests.set(targetTabId, []);
    }
    updateBadge(targetTabId);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'OPEN_STUDIO') {
    openStudioTab(message.tabId || tabId);
    sendResponse({ ok: true });
    return true;
  }

  return true;
});

// Update badge count and color on extension icon
function updateBadge(tabId) {
  if (!tabId) return;
  const list = tabRequests.get(tabId) || [];
  const postCount = list.filter(r => r.method === 'POST').length;
  const errCount = list.filter(r => r.status >= 400 || r.status === 0).length;

  if (list.length === 0) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  // If there are errors, prioritize error badge in red
  if (errCount > 0) {
    chrome.action.setBadgeText({ tabId, text: String(errCount) });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#ef4444' }); // Red
  } else if (postCount > 0) {
    chrome.action.setBadgeText({ tabId, text: String(postCount) });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#db2777' }); // Pink
  } else {
    chrome.action.setBadgeText({ tabId, text: String(list.length) });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#6366f1' }); // Indigo
  }
}

// Clean up memory when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabRequests.delete(tabId);
});

// Clear log on navigation if not preserving log
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.storage.local.get(['apiPulsePreserveLog'], (data) => {
      if (!data.apiPulsePreserveLog) {
        tabRequests.set(tabId, []);
        updateBadge(tabId);
      }
    });
  }
});

// Keyboard Commands handler
chrome.commands.onCommand.addListener(async (command) => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return;

  if (command === 'toggle-hud') {
    chrome.tabs.sendMessage(activeTab.id, { type: 'TOGGLE_HUD' }).catch(() => {});
  } else if (command === 'open-studio') {
    openStudioTab(activeTab.id);
  }
});

// Helper to open or focus the API Pulse Studio
async function openStudioTab(tabId) {
  const studioUrl = chrome.runtime.getURL(`studio/studio.html${tabId ? `?tabId=${tabId}` : ''}`);
  
  // Check if studio already open
  const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('studio/studio.html*') });
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true, url: studioUrl });
    if (tabs[0].windowId) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: studioUrl });
  }
}
