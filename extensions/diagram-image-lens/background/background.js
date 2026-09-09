/**
 * Diagram & Image Lens Pro - Background Service Worker
 * Manifest V3 compatible
 */

// Initialize Context Menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'lens-deep-zoom',
      title: '🔍 Inspect in Deep-Zoom Lens',
      contexts: ['image']
    });

    chrome.contextMenus.create({
      id: 'lens-copy-png',
      title: '📋 Copy Image to Clipboard (PNG)',
      contexts: ['image']
    });

    chrome.contextMenus.create({
      id: 'separator-1',
      type: 'separator',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'lens-snip-area',
      title: '✂️ Snip Area Screenshot',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'lens-toggle',
      title: '⚡ Toggle Hover Magnifier',
      contexts: ['all']
    });
  });

  // Set default settings
  chrome.storage.local.get(['magnifierEnabled', 'zoomLevel', 'lensShape', 'lensSize', 'showToolbar'], (res) => {
    const defaults = {
      magnifierEnabled: true,
      zoomLevel: 3,
      lensShape: 'circle', // 'circle' | 'square'
      lensSize: 200,       // px diameter
      showToolbar: true
    };
    chrome.storage.local.set({ ...defaults, ...res });
  });
});

// Context Menu Click Dispatcher
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'lens-deep-zoom') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'DEEP_ZOOM_URL',
      srcUrl: info.srcUrl
    }).catch(err => console.debug('Tab message failed:', err));
  } else if (info.menuItemId === 'lens-copy-png') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'COPY_IMAGE_URL',
      srcUrl: info.srcUrl
    }).catch(err => console.debug('Tab message failed:', err));
  } else if (info.menuItemId === 'lens-snip-area') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'START_SNIP'
    }).catch(err => console.debug('Tab message failed:', err));
  } else if (info.menuItemId === 'lens-toggle') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'TOGGLE_MAGNIFIER'
    }).catch(err => console.debug('Tab message failed:', err));
  }
});

// Keyboard Commands Listener
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0 || !tabs[0].id) return;
    const tabId = tabs[0].id;

    if (command === 'toggle-magnifier') {
      chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_MAGNIFIER' })
        .catch(err => console.debug('Command error:', err));
    } else if (command === 'launch-snipping') {
      chrome.tabs.sendMessage(tabId, { action: 'START_SNIP' })
        .catch(err => console.debug('Command error:', err));
    }
  });
});

// Message Hub between Content Scripts and Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_VISIBLE_TAB') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        sendResponse({ success: false, error: chrome.runtime.lastError?.message || 'Capture failed' });
      } else {
        sendResponse({ success: true, dataUrl: dataUrl });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'FETCH_IMAGE_BLOB') {
    fetch(request.url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          sendResponse({ success: true, dataUrl: reader.result, mimeType: blob.type });
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });
    return true; // Async response
  }
});
