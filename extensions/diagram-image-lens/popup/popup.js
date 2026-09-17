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
  let cachedVisualItems = [];
  let currentFilter = 'all';
  const filterPills = document.querySelectorAll('#asset-filter-bar .filter-pill');
  const searchInput = document.getElementById('asset-search-input');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderAssets();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderAssets();
    });
  }

  function renderAssets() {
    assetGridContainer.innerHTML = '';
    const query = (searchInput?.value || '').toLowerCase().trim();

    const filtered = cachedVisualItems.filter(item => {
      // Filter type
      if (currentFilter !== 'all') {
        if (currentFilter === 'svg' && item.tag !== 'svg') return false;
        if (currentFilter === 'img' && item.tag !== 'img') return false;
        if (currentFilter === 'canvas' && item.tag !== 'canvas') return false;
      }
      // Query filter
      if (query) {
        const textMatch = (item.alt || '').toLowerCase().includes(query) ||
                          (item.src || '').toLowerCase().includes(query) ||
                          (item.type || '').toLowerCase().includes(query);
        if (!textMatch) return false;
      }
      return true;
    });

    assetCountBadge.textContent = `${filtered.length} / ${cachedVisualItems.length}`;

    if (filtered.length === 0) {
      assetGridContainer.innerHTML = '<div class="asset-empty-state">No matching diagrams or images found.</div>';
      return;
    }

    filtered.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'asset-item';
      itemEl.title = `Click to inspect in Deep-Zoom Lens\n${item.alt || item.type} (${item.width} × ${item.height} px)`;

      itemEl.innerHTML = `
        <img src="${item.src}" alt="${item.alt}" loading="lazy">
        <span class="asset-tag-badge">${item.tag}</span>
        <span class="asset-size-badge">${item.width}×${item.height}</span>
        <div class="asset-card-actions">
          <button class="asset-card-btn btn-copy-link" title="Copy Image Link">
            <svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
          </button>
          <button class="asset-card-btn btn-open-tab" title="Open in New Tab">
            <svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
          </button>
        </div>
      `;

      // Card click opens in deep zoom
      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.asset-card-actions')) return;
        sendActiveTabMessage({ action: 'DEEP_ZOOM_URL', srcUrl: item.src }, () => {
          window.close();
        });
      });

      // Direct Copy Link Button
      const copyLinkBtn = itemEl.querySelector('.btn-copy-link');
      if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(item.src).then(() => {
            copyLinkBtn.innerHTML = '✓';
            setTimeout(() => {
              copyLinkBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';
            }, 1500);
          });
        });
      }

      // Direct Open Tab Button
      const openTabBtn = itemEl.querySelector('.btn-open-tab');
      if (openTabBtn) {
        openTabBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          chrome.tabs.create({ url: item.src });
        });
      }

      assetGridContainer.appendChild(itemEl);
    });
  }

  function scanPageAssets() {
    assetCountBadge.textContent = 'Scanning...';
    assetGridContainer.innerHTML = '';

    sendActiveTabMessage({ action: 'GET_PAGE_VISUALS' }, (response) => {
      if (!response || !response.items || response.items.length === 0) {
        cachedVisualItems = [];
        assetCountBadge.textContent = '0 Found';
        assetGridContainer.innerHTML = '<div class="asset-empty-state">No diagrams or images found on this page yet.</div>';
        return;
      }

      cachedVisualItems = response.items;
      renderAssets();
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
