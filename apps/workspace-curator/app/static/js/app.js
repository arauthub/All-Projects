/**
 * WorkspaceCurator Pro - Frontend Application Controller
 */

// Application State
const state = {
  items: [],
  selectedItem: null,
  activeFilterProduct: "all",
  activeFilterUrgency: "all",
  searchQuery: "",
  stats: { total_curated: 0, high_urgency_count: 0 },
  sseActive: false
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initPresetsDropdown();
  initEventListeners();
  loadStats();
  loadCuratedItems();
  initSSE();
});

// -------------------------------------------------------------
// Data Fetching & Rendering
// -------------------------------------------------------------

async function loadStats() {
  try {
    const res = await fetch("/api/v1/stats");
    if (res.ok) {
      state.stats = await res.json();
      renderStats();
    }
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

function renderStats() {
  const totalEl = document.getElementById("statTotalCurated");
  const urgentEl = document.getElementById("statUrgentCount");
  if (totalEl) totalEl.textContent = state.stats.total_curated || 0;
  if (urgentEl) urgentEl.textContent = state.stats.high_urgency_count || 0;
}

async function loadCuratedItems() {
  const feedList = document.getElementById("curatedFeedList");
  if (!feedList) return;

  try {
    const params = new URLSearchParams();
    if (state.activeFilterProduct !== "all") params.append("product", state.activeFilterProduct);
    if (state.activeFilterUrgency !== "all") params.append("urgency", state.activeFilterUrgency);
    if (state.searchQuery) params.append("query", state.searchQuery);

    const res = await fetch(`/api/v1/curated?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      state.items = data.items || [];
      renderFeed();
    }
  } catch (err) {
    console.error("Error fetching items:", err);
    feedList.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load curated feed</h3><p>${err.message}</p></div>`;
  }
}

function renderFeed() {
  const feedList = document.getElementById("curatedFeedList");
  const countEl = document.getElementById("feedCountDisplay");
  if (!feedList) return;

  if (countEl) countEl.textContent = `${state.items.length} items`;

  if (state.items.length === 0) {
    feedList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📥</div>
        <h3>No curated Workspace events found</h3>
        <p>Use the Simulator panel on the right or configure Google Apps Script / Drive push notifications to ingest live content.</p>
        <button class="btn-header primary" onclick="loadSamplePresetAndDispatch()">
          🚀 Run Sample Preset Now
        </button>
      </div>
    `;
    return;
  }

  feedList.innerHTML = state.items.map(item => createCardHTML(item)).join("");
}

function createCardHTML(item) {
  const productIcons = {
    docs: "📄",
    sheets: "📊",
    gmail: "✉️",
    calendar: "📅",
    forms: "📝",
    drive: "📁",
    chat: "💬",
    other: "🌐"
  };

  const productIcon = productIcons[item.product] || "📁";
  const dateStr = formatRelativeTime(item.received_at);

  // Metrics chips
  const metricsHTML = (item.metrics || []).slice(0, 4).map(m => 
    `<span class="metric-chip">${escapeHtml(m)}</span>`
  ).join("");

  // Action items preview
  const actionsHTML = (item.action_items || []).slice(0, 3).map(a => `
    <div class="action-preview-item ${a.completed ? 'done' : ''}">
      <input type="checkbox" class="action-checkbox" ${a.completed ? 'checked' : ''} 
        onchange="toggleActionItem('${item.id}', '${a.id}', this.checked)" />
      <span>${escapeHtml(a.task)}</span>
      ${a.assignee ? `<span class="action-assignee">@${escapeHtml(a.assignee)}</span>` : ''}
    </div>
  `).join("");

  // Tags
  const tagsHTML = (item.tags || []).slice(0, 5).map(t => 
    `<span class="tag-badge">${escapeHtml(t)}</span>`
  ).join("");

  return `
    <div class="curated-card ${item.urgency}" id="card-${item.id}">
      <div class="card-top">
        <div class="product-meta">
          <span class="product-badge ${item.product}">
            ${productIcon} ${item.product}
          </span>
          <span class="card-time">${dateStr}</span>
        </div>
        <span class="urgency-badge ${item.urgency}">
          ${item.urgency} (${item.urgency_score}%)
        </span>
      </div>

      <div>
        <a class="card-title-link" onclick="openInspectModal('${item.id}')">
          ${escapeHtml(item.source_title)}
        </a>
        <div class="card-sender">
          <span>From:</span> <strong>${escapeHtml(item.source_sender || 'Workspace Event')}</strong>
          ${item.source_url ? `• <a href="${item.source_url}" target="_blank" rel="noreferrer" style="color: var(--accent-cyan); text-decoration: none;">Open Doc ↗</a>` : ''}
        </div>
      </div>

      <div class="card-summary">
        ${escapeHtml(item.summary)}
      </div>

      ${metricsHTML ? `<div class="metric-chips">${metricsHTML}</div>` : ''}

      ${actionsHTML ? `
        <div class="action-preview-list">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">
            Action Items (${item.action_items.filter(a => a.completed).length}/${item.action_items.length} done):
          </div>
          ${actionsHTML}
        </div>
      ` : ''}

      <div class="card-footer">
        <div class="tag-list">${tagsHTML}</div>
        <div class="card-actions-group">
          <button class="btn-card-action" onclick="copyCardFormat('${item.id}', 'markdown')" title="Copy Markdown">
            📋 Markdown
          </button>
          <button class="btn-card-action" onclick="copyCardFormat('${item.id}', 'slack')" title="Copy Slack Digest">
            💬 Slack
          </button>
          <button class="btn-card-action" onclick="openInspectModal('${item.id}')">
            🔍 Inspect
          </button>
          <button class="btn-card-action" onclick="deleteItem('${item.id}')" title="Delete Event">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Interactive Actions & Formatting
// -------------------------------------------------------------

async function toggleActionItem(itemId, actionId, completed) {
  try {
    const res = await fetch(`/api/v1/curated/${itemId}/action/${actionId}?completed=${completed}`, {
      method: "PATCH"
    });
    if (res.ok) {
      showToast("Action item updated");
      // Update local item
      const item = state.items.find(i => i.id === itemId);
      if (item) {
        const act = item.action_items.find(a => a.id === actionId);
        if (act) act.completed = completed;
      }
    }
  } catch (err) {
    showToast("Error updating action item: " + err.message);
  }
}

async function deleteItem(itemId) {
  if (!confirm("Delete this curated entry?")) return;
  try {
    const res = await fetch(`/api/v1/curated/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      state.items = state.items.filter(i => i.id !== itemId);
      renderFeed();
      loadStats();
      showToast("Curated entry deleted");
    }
  } catch (err) {
    showToast("Error deleting item: " + err.message);
  }
}

async function copyCardFormat(itemId, format) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;

  const textToCopy = item.formats ? item.formats[format] : item.summary;
  if (!textToCopy) return;

  try {
    await navigator.clipboard.writeText(textToCopy);
    showToast(`Copied ${format.toUpperCase()} format to clipboard!`);
  } catch (err) {
    showToast("Clipboard copy failed");
  }
}

// -------------------------------------------------------------
// Modal & Content Inspection
// -------------------------------------------------------------

let currentModalItem = null;
let currentModalTab = "markdown";

function openInspectModal(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;

  currentModalItem = item;
  document.getElementById("modalTitle").textContent = item.source_title;
  renderModalTabContent();

  const modal = document.getElementById("inspectModal");
  if (modal) modal.classList.add("active");
}

function closeInspectModal() {
  const modal = document.getElementById("inspectModal");
  if (modal) modal.classList.remove("active");
  currentModalItem = null;
}

function setModalTab(tabName) {
  currentModalTab = tabName;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  renderModalTabContent();
}

function renderModalTabContent() {
  const container = document.getElementById("modalTabContent");
  if (!container || !currentModalItem) return;

  let content = "";
  const formats = currentModalItem.formats || {};

  if (currentModalTab === "markdown") {
    content = formats.markdown || currentModalItem.summary;
  } else if (currentModalTab === "slack") {
    content = formats.slack || currentModalItem.summary;
  } else if (currentModalTab === "email") {
    content = formats.email || currentModalItem.summary;
  } else if (currentModalTab === "json_ld") {
    content = formats.json_ld || JSON.stringify(currentModalItem, null, 2);
  } else if (currentModalTab === "raw") {
    content = currentModalItem.raw_content;
  }

  container.innerHTML = `
    <div class="copy-row">
      <button class="btn-copy" onclick="copyCurrentModalText()">📋 Copy Current View</button>
    </div>
    <pre class="format-code-block" id="modalCodeBlock">${escapeHtml(content)}</pre>
  `;
}

async function copyCurrentModalText() {
  const codeBlock = document.getElementById("modalCodeBlock");
  if (!codeBlock) return;
  try {
    await navigator.clipboard.writeText(codeBlock.textContent);
    showToast("Copied to clipboard!");
  } catch (err) {
    showToast("Copy failed");
  }
}

// -------------------------------------------------------------
// Webhook Simulator Controller
// -------------------------------------------------------------

function initPresetsDropdown() {
  const select = document.getElementById("presetSelect");
  if (!select || typeof WORKSPACE_PRESETS === "undefined") return;

  select.innerHTML = '<option value="">-- Choose a realistic Workspace preset --</option>' + 
    WORKSPACE_PRESETS.map(p => `
      <option value="${p.id}">${escapeHtml(p.name)}</option>
    `).join("");

  select.addEventListener("change", (e) => {
    const selected = WORKSPACE_PRESETS.find(p => p.id === e.target.value);
    if (selected) {
      document.getElementById("simProduct").value = selected.product;
      document.getElementById("simTitle").value = selected.name;
      document.getElementById("simSender").value = selected.sender;
      document.getElementById("simUrl").value = selected.url;
      document.getElementById("simContent").value = selected.content;
    }
  });

  // Default to first preset
  if (WORKSPACE_PRESETS.length > 0) {
    select.value = WORKSPACE_PRESETS[0].id;
    select.dispatchEvent(new Event("change"));
  }
}

async function dispatchSimulation() {
  const btn = document.getElementById("btnDispatchSim");
  const product = document.getElementById("simProduct").value;
  const title = document.getElementById("simTitle").value.trim();
  const sender = document.getElementById("simSender").value.trim();
  const url = document.getElementById("simUrl").value.trim();
  const content = document.getElementById("simContent").value.trim();

  if (!title || !content) {
    showToast("Title and content are required");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "⚡ Ingesting & Analyzing...";
  }

  try {
    const res = await fetch("/api/v1/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: product,
        source_title: title,
        source_sender: sender || "Google Workspace Event",
        source_url: url || null,
        content: content
      })
    });

    if (res.ok) {
      const result = await res.json();
      showToast(`✅ Curated Google ${result.product.toUpperCase()}: ${result.source_title.slice(0, 30)}...`);
      loadStats();
      // Prepend to items list if not already updated via SSE
      if (!state.items.some(i => i.id === result.id)) {
        state.items.unshift(result);
        renderFeed();
      }
    } else {
      const errData = await res.json();
      showToast("Simulation error: " + (errData.detail || "Unknown error"));
    }
  } catch (err) {
    showToast("Network error: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "🚀 Dispatch Simulated Webhook";
    }
  }
}

function loadSamplePresetAndDispatch() {
  if (typeof WORKSPACE_PRESETS !== "undefined" && WORKSPACE_PRESETS.length > 0) {
    const select = document.getElementById("presetSelect");
    if (select) {
      select.value = WORKSPACE_PRESETS[0].id;
      select.dispatchEvent(new Event("change"));
    }
    dispatchSimulation();
  }
}

// -------------------------------------------------------------
// Real-time Server Sent Events (SSE)
// -------------------------------------------------------------

function initSSE() {
  const sseIndicator = document.getElementById("liveSSEIndicator");
  if (!window.EventSource) return;

  const es = new EventSource("/api/v1/events/stream");

  es.onopen = () => {
    state.sseActive = true;
    if (sseIndicator) sseIndicator.style.display = "flex";
  };

  es.onmessage = (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item && item.id) {
        // Add to items list if not present
        if (!state.items.some(i => i.id === item.id)) {
          state.items.unshift(item);
          renderFeed();
          loadStats();
          showToast(`⚡ Live Ingestion: Google ${item.product.toUpperCase()} update received!`);
        }
      }
    } catch (e) {
      // heartbeat ping or malformed event
    }
  };

  es.onerror = () => {
    state.sseActive = false;
  };
}

// -------------------------------------------------------------
// Modals for Google Apps Script & Settings
// -------------------------------------------------------------

function openAppsScriptModal() {
  const modal = document.getElementById("appsScriptModal");
  if (modal) modal.classList.add("active");
}

function closeAppsScriptModal() {
  const modal = document.getElementById("appsScriptModal");
  if (modal) modal.classList.remove("active");
}

async function copyAppsScriptCode() {
  try {
    const res = await fetch("/static/js/../google_apps_script.js").catch(() => null);
    let code = "";
    if (res && res.ok) {
      code = await res.text();
    } else {
      const codeEl = document.getElementById("appsScriptCodePreview");
      code = codeEl ? codeEl.textContent : "";
    }
    await navigator.clipboard.writeText(code);
    showToast("Google Apps Script code copied to clipboard!");
  } catch (err) {
    showToast("Copy failed: " + err.message);
  }
}

function openSettingsModal() {
  fetchSettings();
  const modal = document.getElementById("settingsModal");
  if (modal) modal.classList.add("active");
}

function closeSettingsModal() {
  const modal = document.getElementById("settingsModal");
  if (modal) modal.classList.remove("active");
}

async function fetchSettings() {
  try {
    const res = await fetch("/api/v1/settings");
    if (res.ok) {
      const s = await res.json();
      const urlInput = document.getElementById("settingForwarderUrl");
      const enabledInput = document.getElementById("settingForwarderEnabled");
      const endpointSpan = document.getElementById("webhookEndpointUrl");
      const rssSpan = document.getElementById("rssFeedUrl");

      if (urlInput) urlInput.value = s.forwarder_url || "";
      if (enabledInput) enabledInput.checked = s.forwarder_enabled || false;
      if (endpointSpan) endpointSpan.textContent = s.webhook_endpoint;
      if (rssSpan) rssSpan.textContent = s.rss_url;
    }
  } catch (err) {
    console.error("Error fetching settings:", err);
  }
}

async function saveSettings() {
  const url = document.getElementById("settingForwarderUrl").value.trim();
  const enabled = document.getElementById("settingForwarderEnabled").checked;

  try {
    const res = await fetch("/api/v1/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhook_url: url, enabled: enabled })
    });
    if (res.ok) {
      showToast("Settings saved successfully!");
      closeSettingsModal();
    }
  } catch (err) {
    showToast("Error saving settings: " + err.message);
  }
}

// -------------------------------------------------------------
// Filters & Search Event Listeners
// -------------------------------------------------------------

function initEventListeners() {
  // Product Filter Chips
  document.querySelectorAll(".chip-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeFilterProduct = btn.dataset.product || "all";
      loadCuratedItems();
    });
  });

  // Search input with debounce
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        loadCuratedItems();
      }, 250);
    });
  }
}

// -------------------------------------------------------------
// Utilities
// -------------------------------------------------------------

function showToast(msg) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatRelativeTime(isoString) {
  if (!isoString) return "just now";
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString();
}
