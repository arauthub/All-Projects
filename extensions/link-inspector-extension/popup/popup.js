// Link Inspector Popup Controller - Power Edition

document.addEventListener('DOMContentLoaded', async () => {
  const toggleInspector = document.getElementById('toggle-inspector');
  const toggleHighlights = document.getElementById('toggle-highlights');
  const selectPointerStyle = document.getElementById('select-pointer-style');

  const btnRefresh = document.getElementById('btn-refresh');
  const btnScan = document.getElementById('btn-scan');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnExportJson = document.getElementById('btn-export-json');

  const inputSearch = document.getElementById('input-search');
  const selectFilter = document.getElementById('select-filter');
  const linksContainer = document.getElementById('links-container');

  const metricTotal = document.getElementById('metric-total');
  const metricInternal = document.getElementById('metric-internal');
  const metricExternal = document.getElementById('metric-external');
  const metricRedirects = document.getElementById('metric-redirects');
  const metricBroken = document.getElementById('metric-broken');

  const progressContainer = document.getElementById('scan-progress-container');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressText = document.getElementById('progress-text');
  const progressPercent = document.getElementById('progress-percent');

  let currentLinksData = [];

  // Initialize State from Storage
  chrome.storage.local.get(['inspectorEnabled', 'highlightEnabled', 'pointerStyle'], (res) => {
    toggleInspector.checked = res.inspectorEnabled !== undefined ? !!res.inspectorEnabled : true;
    toggleHighlights.checked = !!res.highlightEnabled;
    if (res.pointerStyle && selectPointerStyle) {
      selectPointerStyle.value = res.pointerStyle;
    }
  });

  // Toggle Event Listeners
  toggleInspector.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ inspectorEnabled: enabled });
    const tab = await getActiveTab();
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'SET_INSPECTOR_STATE', enabled });
    }
  });

  toggleHighlights.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ highlightEnabled: enabled });
    const tab = await getActiveTab();
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'SET_HIGHLIGHT_STATE', enabled });
    }
  });

  // Pointer Style Selector
  if (selectPointerStyle) {
    selectPointerStyle.addEventListener('change', async (e) => {
      const style = e.target.value;
      chrome.storage.local.set({ pointerStyle: style });
      const tab = await getActiveTab();
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'SET_POINTER_STYLE', style });
      }
    });
  }

  // Load Initial Page Link Summary
  await refreshPageLinks();

  // Button Listeners
  btnRefresh.addEventListener('click', refreshPageLinks);

  btnScan.addEventListener('click', async () => {
    btnScan.disabled = true;
    progressContainer.classList.remove('hidden');
    updateProgress(10, 'Scanning DOM links...');

    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      alert('Cannot scan links on this tab.');
      btnScan.disabled = false;
      progressContainer.classList.add('hidden');
      return;
    }

    updateProgress(35, 'Checking HTTP headers & redirects...');
    chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_FULL_SCAN' }, (response) => {
      updateProgress(100, 'Scan Complete!');
      setTimeout(() => progressContainer.classList.add('hidden'), 1200);
      btnScan.disabled = false;

      if (response && response.links) {
        currentLinksData = response.links;
        updateMetricsUI(response);
        renderLinksList(currentLinksData);
        btnExportCsv.disabled = currentLinksData.length === 0;
        btnExportJson.disabled = currentLinksData.length === 0;
      }
    });
  });

  btnExportCsv.addEventListener('click', () => {
    if (!currentLinksData || currentLinksData.length === 0) return;
    exportToCSV(currentLinksData);
  });

  btnExportJson.addEventListener('click', () => {
    if (!currentLinksData || currentLinksData.length === 0) return;
    exportToJSON(currentLinksData);
  });

  // Filter & Search Inputs
  inputSearch.addEventListener('input', applyFiltersAndRender);
  selectFilter.addEventListener('change', applyFiltersAndRender);

  /**
   * Fetch link summary from current active tab
   */
  async function refreshPageLinks() {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      renderEmptyState('Cannot inspect links on system pages.');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_LINKS_SUMMARY' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        renderEmptyState('Re-open or refresh this web page to inspect links.');
        return;
      }

      currentLinksData = response.links || [];
      updateMetricsUI(response);
      renderLinksList(currentLinksData);
      btnExportCsv.disabled = currentLinksData.length === 0;
      btnExportJson.disabled = currentLinksData.length === 0;
    });
  }

  /**
   * Update Top Summary Cards
   */
  function updateMetricsUI(data) {
    metricTotal.textContent = data.total || 0;
    metricInternal.textContent = data.internal || 0;
    metricExternal.textContent = data.external || 0;
    metricRedirects.textContent = data.redirects !== undefined ? data.redirects : '0';
    metricBroken.textContent = data.broken !== undefined ? data.broken : '?';
  }

  /**
   * Filter and render items
   */
  function applyFiltersAndRender() {
    const query = inputSearch.value.toLowerCase().trim();
    const filter = selectFilter.value;

    const filtered = currentLinksData.filter((item) => {
      const matchSearch = item.url.toLowerCase().includes(query) || (item.text && item.text.toLowerCase().includes(query));
      if (!matchSearch) return false;

      if (filter === 'internal') return !item.isExternal;
      if (filter === 'external') return item.isExternal;
      if (filter === 'nofollow') return item.isNofollow;
      if (filter === 'redirects') return (item.status >= 300 && item.status < 400) || item.redirected;
      if (filter === 'broken') return item.ok === false || (item.status && item.status >= 400);
      if (filter === 'insecure') return item.isInsecure;
      if (filter === 'weak-seo') return item.isWeakSeo;
      if (filter === 'tracked') return item.hasTracking;

      return true;
    });

    renderLinksList(filtered);
  }

  /**
   * Render List of Links into DOM
   */
  function renderLinksList(links) {
    linksContainer.innerHTML = '';

    if (links.length === 0) {
      renderEmptyState('No matching links found on page.');
      return;
    }

    links.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'link-item';

      let statusBadgeClass = 'badge-unchecked';
      let statusText = 'Unchecked';

      if (item.status !== undefined) {
        if (item.status === 200) {
          statusBadgeClass = 'badge-200';
          statusText = '200 OK';
        } else if (item.status >= 300 && item.status < 400) {
          statusBadgeClass = 'badge-300';
          statusText = `${item.status} Redirect`;
        } else if (item.status >= 400) {
          statusBadgeClass = 'badge-400';
          statusText = `${item.status} ${item.statusText || 'Error'}`;
        } else {
          statusBadgeClass = 'badge-err';
          statusText = item.statusText || 'Error';
        }
      }

      let badgesHtml = `<span class="badge ${statusBadgeClass}">${escapeHtml(statusText)}</span>`;
      if (item.hasTracking) {
        badgesHtml += `<span class="badge badge-tracking" title="Contains UTM / tracking tokens">UTM</span>`;
      }
      if (item.isWeakSeo) {
        badgesHtml += `<span class="badge badge-seo" title="Missing or generic anchor text">SEO</span>`;
      }

      let redirectHtml = '';
      if (item.redirected && item.finalUrl && item.finalUrl !== item.url) {
        redirectHtml = `<div class="link-redirect-hint" title="Redirects to: ${escapeHtml(item.finalUrl)}">↳ ${escapeHtml(item.finalUrl)}</div>`;
      }

      card.innerHTML = `
        <div class="link-item-header">
          <span class="link-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text || '[No Text]')}</span>
          <div class="badge-group">${badgesHtml}</div>
        </div>
        <div class="link-url" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</div>
        ${redirectHtml}
      `;

      // Click to scroll and inspect link on page
      card.addEventListener('click', async () => {
        const tab = await getActiveTab();
        if (tab && tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'INSPECT_SINGLE_LINK',
            linkUrl: item.url
          });
        }
      });

      linksContainer.appendChild(card);
    });
  }

  function renderEmptyState(message) {
    linksContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔗</div>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function updateProgress(percent, label) {
    progressBarFill.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    if (label) progressText.textContent = label;
  }

  /**
   * Export to CSV
   */
  function exportToCSV(data) {
    const headers = ['URL', 'Anchor Text', 'Type', 'Target', 'Rel', 'HTTP Status', 'Redirect Destination', 'Has Tracking', 'Weak SEO'];
    const rows = data.map((item) => [
      `"${(item.url || '').replace(/"/g, '""')}"`,
      `"${(item.text || '').replace(/"/g, '""')}"`,
      item.isExternal ? 'External' : 'Internal',
      item.target || '_self',
      item.rel || 'none',
      item.status || 'N/A',
      `"${(item.finalUrl || '').replace(/"/g, '""')}"`,
      item.hasTracking ? 'Yes' : 'No',
      item.isWeakSeo ? 'Yes' : 'No'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, `link_audit_${getTimestamp()}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Export to JSON
   */
  function exportToJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `link_audit_${getTimestamp()}.json`, 'application/json;charset=utf-8;');
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getTimestamp() {
    return new Date().toISOString().slice(0, 10);
  }

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
