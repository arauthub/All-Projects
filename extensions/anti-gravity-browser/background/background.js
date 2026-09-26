/**
 * Anti-Gravity Web Background Service Worker
 * Handles keyboard shortcut triggers, active tab messaging, and script injection.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Anti-Gravity Web] Extension installed.');
});

// Handle keyboard shortcut command (Alt+Shift+G / Command+Shift+G)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-antigravity') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;
    toggleAntiGravityOnTab(tab.id);
  }
});

/**
 * Sends toggle action to the content script, or injects scripts if tab was already loaded.
 */
async function toggleAntiGravityOnTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_ANTIGRAVITY' });
    updateBadge(tabId, response?.isActive);
  } catch (err) {
    // If content script is not responding (e.g. page was open before extension installed), inject it dynamically
    try {
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['content/content.css']
      });
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['lib/matter.min.js', 'content/content.js']
      });
      // Try sending toggle once injected
      const response = await chrome.tabs.sendMessage(tabId, { action: 'TOGGLE_ANTIGRAVITY' });
      updateBadge(tabId, response?.isActive);
    } catch (injectErr) {
      console.warn('[Anti-Gravity Web] Cannot inject on this page:', injectErr.message);
    }
  }
}

/**
 * Updates browser action badge with current status
 */
function updateBadge(tabId, isActive) {
  if (isActive) {
    chrome.action.setBadgeText({ tabId, text: 'ZERO' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#8b5cf6' });
  } else {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

// Listen for status updates from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'UPDATE_STATUS' && sender.tab?.id) {
    updateBadge(sender.tab.id, message.isActive);
    sendResponse({ success: true });
  }
});
