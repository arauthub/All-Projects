// API Pulse Pro - DevTools Panel Initializer

const inspectedTabId = chrome.devtools.inspectedWindow.tabId;
const panelUrl = `studio/studio.html?tabId=${inspectedTabId}`;

chrome.devtools.panels.create(
  "API Pulse",
  "assets/icon16.png",
  panelUrl,
  function (panel) {
    // DevTools panel created successfully
  }
);
