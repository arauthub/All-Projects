/**
 * Diagram & Image Lens Pro - Popup Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const masterToggle = document.getElementById('master-toggle');
  const toolbarToggle = document.getElementById('toolbar-toggle');
  const zoomValText = document.getElementById('zoom-val-text');
  const zoomButtons = document.querySelectorAll('#zoom-control .seg-btn');
  const shapeButtons = document.querySelectorAll('#shape-control .seg-btn');
  const sizeButtons = document.querySelectorAll('#size-control .seg-btn');
  const btnSnipTool = document.getElementById('btn-snip-tool');
  const btnRefreshAssets = document.getElementById('btn-refresh-assets');
  const assetCountBadge = document.getElementById('asset-count-badge');
  const assetGridContainer = document.getElementById('asset-grid-container');

  // 1. Load Settings from chrome.storage
  chrome.storage.local.get(['magnifierEnabled', 'zoomLevel', 'lensShape', 'lensSize', 'showToolbar'], (res) => {
    // Master Toggle
    masterToggle.checked = res.magnifierEnabled !== undefined ? res.magnifierEnabled : true;

    // Toolbar Toggle
    toolbarToggle.checked = res.showToolbar !== undefined ? res.showToolbar : true;

    // Zoom Level
    const currentZoom = res.zoomLevel || 3;
    zoomValText.textContent = `${currentZoom}x`;
    zoomButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.zoom == currentZoom);
    });

    // Lens Shape
    const currentShape = res.lensShape || 'circle';
    shapeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.shape === currentShape);
    });

    // Lens Size
    const currentSize = res.lensSize || 200;
    sizeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size == currentSize);
    });
  });

  // 2. Master Toggle Change
  masterToggle.addEventListener('change', () => {
    chrome.storage.local.set({ magnifierEnabled: masterToggle.checked });
    sendActiveTabMessage({ action: 'TOGGLE_MAGNIFIER' });
  });

  // 3. Toolbar Toggle Change
  toolbarToggle.addEventListener('change', () => {
    chrome.storage.local.set({ showToolbar: toolbarToggle.checked });
  });

  // 4. Zoom Buttons
  zoomButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      zoomButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const z = Number(btn.dataset.zoom);
      zoomValText.textContent = `${z}x`;
      chrome.storage.local.set({ zoomLevel: z });
    });
  });

  // 5. Shape Buttons
  shapeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chrome.storage.local.set({ lensShape: btn.dataset.shape });
    });
  });

  // 6. Size Buttons
  sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chrome.storage.local.set({ lensSize: Number(btn.dataset.size) });
    });
  });

  // 7. Launch Snipping Area Screenshot Tool
  btnSnipTool.addEventListener('click', () => {
    sendActiveTabMessage({ action: 'START_SNIP' }, () => {
      window.close(); // Close popup so user can snip freely
    });
  });

  // 8. Scan Diagrams and Visual Assets on Active Tab
  function scanPageAssets() {
    assetCountBadge.textContent = 'Scanning...';
    assetGridContainer.innerHTML = '';

    sendActiveTabMessage({ action: 'GET_PAGE_VISUALS' }, (response) => {
      if (!response || !response.items || response.items.length === 0) {
        assetCountBadge.textContent = '0 Found';
        assetGridContainer.innerHTML = '<div class="asset-empty-state">No diagrams or images found on this page yet.</div>';
        return;
      }

      const items = response.items;
      assetCountBadge.textContent = `${items.length} Found`;

      items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'asset-item';
        itemEl.title = `Click to inspect in Deep-Zoom Lens\n${item.alt || item.type} (${item.width} × ${item.height} px)`;

        itemEl.innerHTML = `
          <img src="${item.src}" alt="${item.alt}" loading="lazy">
          <span class="asset-tag-badge">${item.tag}</span>
          <span class="asset-size-badge">${item.width}×${item.height}</span>
        `;

        itemEl.addEventListener('click', () => {
          sendActiveTabMessage({ action: 'DEEP_ZOOM_URL', srcUrl: item.src }, () => {
            window.close();
          });
        });

        assetGridContainer.appendChild(itemEl);
      });
    });
  }

  btnRefreshAssets.addEventListener('click', scanPageAssets);
  scanPageAssets();

  // Helper to send message to active tab
  function sendActiveTabMessage(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0].id) {
        if (callback) callback(null);
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, message, (res) => {
        if (chrome.runtime.lastError) {
          if (callback) callback(null);
          return;
        }
        if (callback) callback(res);
      });
    });
  }
});
