/**
 * app/static/js/app.js
 * Main Frontend Application Controller for Multi-Agent Orchestrator.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Core State
  let currentMissionId = null;
  let activeEventSource = null;
  let allMessages = [];
  let filterAgentId = null;
  let currentPresentationSlides = [];

  // DOM Elements
  const promptInput = document.getElementById("prompt-input");
  const btnLaunch = document.getElementById("btn-launch-mission");
  const scenariosContainer = document.getElementById("scenarios-container");
  const consoleStream = document.getElementById("console-stream");
  const tabContentArea = document.getElementById("tab-content-area");
  const modeBadge = document.getElementById("mode-badge");

  // Modals
  const vectorModal = document.getElementById("vector-modal");
  const gcpModal = document.getElementById("gcp-modal");
  const configModal = document.getElementById("config-modal");

  // Initialize Sub-Engines
  const presentationEngine = new PresentationEngine();
  const dagVisualizer = new DAGVisualizer("dag-pipeline", (agentId) => {
    filterMessages(agentId);
  });

  // 1. Fetch System Status
  async function loadSystemStatus() {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (modeBadge) {
        if (data.mode === "gemini_live") {
          modeBadge.innerHTML = `<span class="status-indicator" style="background:#10b981"></span> Gemini Live Mode`;
        } else {
          modeBadge.innerHTML = `<span class="status-indicator"></span> Autonomous Simulation (Zero-Key)`;
        }
      }
    } catch (e) {
      console.warn("Failed loading status:", e);
    }
  }

  // 2. Fetch and Render Demo Scenarios
  async function loadScenarios() {
    try {
      const res = await fetch("/api/scenarios");
      const data = await res.json();
      if (!scenariosContainer || !data.scenarios) return;

      scenariosContainer.innerHTML = "";
      data.scenarios.forEach(sc => {
        const card = document.createElement("div");
        card.className = "scenario-card";
        card.innerHTML = `
          <div class="scenario-title">${sc.title}</div>
          <div class="scenario-desc">${sc.description}</div>
        `;
        card.addEventListener("click", () => {
          promptInput.value = sc.objective;
          launchMission(sc.objective);
        });
        scenariosContainer.appendChild(card);
      });
    } catch (e) {
      console.warn("Failed loading scenarios:", e);
    }
  }

  // 3. Launch Multi-Agent Mission
  async function launchMission(objectiveText) {
    const objective = objectiveText || promptInput.value.trim();
    if (!objective) {
      alert("Please enter a mission objective or select a demo scenario.");
      return;
    }

    // Reset UI
    if (activeEventSource) {
      activeEventSource.close();
      activeEventSource = null;
    }
    allMessages = [];
    filterAgentId = null;
    currentPresentationSlides = [];
    dagVisualizer.reset();
    consoleStream.innerHTML = "";
    tabContentArea.innerHTML = `<div class="empty-placeholder"><div class="empty-icon">⏳</div><div>Orchestrating multi-agent pipeline...</div></div>`;

    btnLaunch.disabled = true;
    btnLaunch.innerHTML = "<span>⚙️ Orchestrating...</span>";

    try {
      // Step A: Create mission on server
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective }),
      });
      const data = await res.json();
      currentMissionId = data.mission_id;

      // Step B: Connect SSE stream
      activeEventSource = new EventSource(`/api/missions/${currentMissionId}/stream`);

      activeEventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleStreamEvent(payload);
        } catch (err) {
          console.error("Error parsing stream event:", err);
        }
      };

      activeEventSource.onerror = () => {
        btnLaunch.disabled = false;
        btnLaunch.innerHTML = "<span>🚀 Launch Swarm</span>";
        if (activeEventSource) {
          activeEventSource.close();
          activeEventSource = null;
        }
      };

    } catch (err) {
      alert(`Failed to launch mission: ${err.message}`);
      btnLaunch.disabled = false;
      btnLaunch.innerHTML = "<span>🚀 Launch Swarm</span>";
    }
  }

  // 4. Handle Live SSE Stream Events
  function handleStreamEvent(event) {
    switch (event.type) {
      case "mission_started":
        appendSystemLog(`🎯 Mission Started: "${event.objective}"`);
        break;

      case "agent_activated":
        dagVisualizer.setActiveAgent(event.agent_id);
        appendSystemLog(`▶ Activated Agent: [${event.agent_name}] (Step ${event.step}/${event.total_steps})`);
        break;

      case "agent_message":
        allMessages.push(event.message);
        renderMessageCard(event.message);
        break;

      case "agent_completed":
        dagVisualizer.setAgentCompleted(event.agent_id);
        updateBlackboardTabPreview(event.blackboard);
        break;

      case "mission_completed":
        btnLaunch.disabled = false;
        btnLaunch.innerHTML = "<span>🚀 Launch Swarm</span>";
        if (activeEventSource) {
          activeEventSource.close();
          activeEventSource = null;
        }
        appendSystemLog("🎉 Multi-Agent Mission Successfully Completed!");

        // Update presentation slides
        if (event.presentation_deck) {
          currentPresentationSlides = event.presentation_deck;
          presentationEngine.setSlides(currentPresentationSlides);
          // Highlight presentation button
          const deckBtn = document.getElementById("btn-view-deck");
          if (deckBtn) deckBtn.classList.add("btn-glow-emerald");
        }

        // Switch tab to presentation or blueprint
        setActiveTab("tab-presentation", event.full_memory.blackboard);
        break;

      case "error":
        appendSystemLog(`❌ Error: ${event.message}`);
        btnLaunch.disabled = false;
        btnLaunch.innerHTML = "<span>🚀 Launch Swarm</span>";
        break;
    }
  }

  function appendSystemLog(text) {
    const el = document.createElement("div");
    el.style.fontSize = "0.78rem";
    el.style.fontFamily = "var(--font-mono)";
    el.style.color = "var(--accent-cyan)";
    el.style.padding = "0.25rem 0.5rem";
    el.style.background = "rgba(6, 182, 212, 0.08)";
    el.style.borderRadius = "var(--radius-sm)";
    el.textContent = text;
    consoleStream.appendChild(el);
    consoleStream.scrollTop = consoleStream.scrollHeight;
  }

  // 5. Render Message Bubble in Console
  function renderMessageCard(msg) {
    if (filterAgentId && msg.agent_id !== filterAgentId) return;

    const card = document.createElement("div");
    card.className = "msg-card";

    let badgeClass = `msg-type-${msg.message_type}`;

    card.innerHTML = `
      <div class="msg-header">
        <div class="msg-agent-info">
          <span>${msg.agent_name}</span>
          <span class="msg-type-badge ${badgeClass}">${msg.message_type.replace('_', ' ')}</span>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">
          ${new Date(msg.timestamp * 1000).toLocaleTimeString()}
        </div>
      </div>
      <div class="msg-content">${formatMarkdownBasic(msg.content)}</div>
    `;

    consoleStream.appendChild(card);
    consoleStream.scrollTop = consoleStream.scrollHeight;
  }

  function filterMessages(agentId) {
    if (filterAgentId === agentId) {
      filterAgentId = null; // Toggle off filter
    } else {
      filterAgentId = agentId;
    }
    consoleStream.innerHTML = "";
    if (filterAgentId) {
      appendSystemLog(`🔍 Filtering logs for: ${agentId.toUpperCase()} (Click node again to show all)`);
    }
    allMessages.forEach(msg => renderMessageCard(msg));
  }

  function formatMarkdownBasic(text) {
    if (!text) return "";
    let formatted = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    return formatted;
  }

  // 6. Blackboard Tabs Switcher
  let activeTabName = "tab-plan";
  let latestBlackboard = null;

  function updateBlackboardTabPreview(blackboard) {
    latestBlackboard = blackboard;
    setActiveTab(activeTabName, blackboard);
  }

  function setActiveTab(tabId, blackboard) {
    activeTabName = tabId;
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.id === `btn-${tabId}`);
    });

    const bb = blackboard || latestBlackboard || {};
    let contentHtml = "";

    if (tabId === "tab-plan") {
      contentHtml = `
        <div class="markdown-body">
          <h3>📋 Autonomous Mission Decomposition Plan</h3>
          <p>The mission has been structured into sequential topological dependencies:</p>
          <ul>
            <li><strong>Phase 1: Knowledge Retrieval & RAG</strong> (Scout Intelligence)</li>
            <li><strong>Phase 2: Cloud Architecture Specification</strong> (Vanguard Architect)</li>
            <li><strong>Phase 3: Adversarial Quality & Security Audit</strong> (Sentinel Auditor)</li>
            <li><strong>Phase 4: Executive Briefing & Slide Presentation</strong> (Aegis Synthesizer)</li>
          </ul>
        </div>
      `;
    } else if (tabId === "tab-research") {
      const findings = bb.research_findings || "Awaiting research output...";
      contentHtml = `<div class="markdown-body">${formatMarkdownBasic(findings)}</div>`;
    } else if (tabId === "tab-architecture") {
      const arch = bb.architecture_blueprint || "Awaiting architectural blueprint...";
      contentHtml = `<div class="markdown-body">${formatMarkdownBasic(arch)}</div>`;
    } else if (tabId === "tab-critique") {
      const critique = bb.critique_evaluation ? bb.critique_evaluation.critique : "Awaiting critic audit...";
      contentHtml = `<div class="markdown-body">${formatMarkdownBasic(critique)}</div>`;
    } else if (tabId === "tab-presentation") {
      const slides = bb.presentation_deck || currentPresentationSlides;
      if (!slides || slides.length === 0) {
        contentHtml = `<div class="empty-placeholder"><div class="empty-icon">📊</div><div>Presentation will be generated when mission completes.</div></div>`;
      } else {
        contentHtml = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.25rem;">
            <div>
              <h3 style="margin:0; font-size:1.1rem;">📊 Generated Presentation Slide Deck (${slides.length} Slides)</h3>
              <div style="font-size:0.8rem; color:var(--text-muted)">Ready for executive briefing or stakeholder reviews.</div>
            </div>
            <button class="btn btn-primary" id="btn-open-deck-modal">🖥️ Launch Fullscreen Mode</button>
          </div>
          <div class="slides-preview-list">
            ${slides.map((s, idx) => `
              <div class="slide-preview-card" style="border-left-color: ${s.accent_color || '#6366f1'}">
                <div class="slide-tag" style="color: ${s.accent_color || '#6366f1'}">${s.tag || 'SLIDE ' + (idx + 1)}</div>
                <div class="slide-title">${s.title}</div>
                <div class="slide-subtitle">${s.subtitle || ''}</div>
                <ul class="slide-bullets">
                  ${(s.points || []).map(p => `<li>${p}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    tabContentArea.innerHTML = contentHtml;

    // Attach open deck listener if button exists
    const openDeckBtn = document.getElementById("btn-open-deck-modal");
    if (openDeckBtn) {
      openDeckBtn.addEventListener("click", () => presentationEngine.open());
    }
  }

  // Bind Tab Click Handlers
  document.getElementById("btn-tab-plan")?.addEventListener("click", () => setActiveTab("tab-plan"));
  document.getElementById("btn-tab-research")?.addEventListener("click", () => setActiveTab("tab-research"));
  document.getElementById("btn-tab-architecture")?.addEventListener("click", () => setActiveTab("tab-architecture"));
  document.getElementById("btn-tab-critique")?.addEventListener("click", () => setActiveTab("tab-critique"));
  document.getElementById("btn-tab-presentation")?.addEventListener("click", () => setActiveTab("tab-presentation"));

  // Top Nav Deck Button
  document.getElementById("btn-view-deck")?.addEventListener("click", () => presentationEngine.open());

  // Launch button listener
  btnLaunch?.addEventListener("click", () => launchMission());
  promptInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") launchMission();
  });

  // 7. Modals: Vector Store Explorer
  const btnOpenVector = document.getElementById("btn-open-vector-store");
  const btnCloseVector = document.getElementById("btn-close-vector-modal");
  const vectorQueryInput = document.getElementById("vector-query-input");
  const btnVectorSearch = document.getElementById("btn-vector-search");
  const vectorResultsArea = document.getElementById("vector-results-area");

  btnOpenVector?.addEventListener("click", () => {
    vectorModal.classList.add("active");
    runVectorSearch("Cloud Run serverless");
  });
  btnCloseVector?.addEventListener("click", () => vectorModal.classList.remove("active"));

  btnVectorSearch?.addEventListener("click", () => runVectorSearch(vectorQueryInput.value));
  vectorQueryInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runVectorSearch(vectorQueryInput.value);
  });

  async function runVectorSearch(query) {
    if (!query) return;
    vectorResultsArea.innerHTML = "<div style='color:var(--text-muted); font-size:0.85rem;'>Searching vector store...</div>";
    try {
      const res = await fetch("/api/vector-store/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, top_k: 4 }),
      });
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        vectorResultsArea.innerHTML = "<div style='color:var(--text-muted); font-size:0.85rem;'>No matching documents found.</div>";
        return;
      }
      vectorResultsArea.innerHTML = data.results.map(doc => `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; margin-bottom:0.75rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <div style="font-weight:600; color:white; font-size:0.95rem;">${doc.title}</div>
            <div style="font-size:0.75rem; background:rgba(6,182,212,0.15); color:var(--accent-cyan); padding:0.15rem 0.5rem; border-radius:var(--radius-full); font-family:var(--font-mono);">
              Score: ${(doc.similarity_score * 100).toFixed(1)}%
            </div>
          </div>
          <div style="font-size:0.75rem; color:var(--accent-indigo); margin-bottom:0.5rem;">${doc.category}</div>
          <div style="font-size:0.85rem; color:#94a3b8; line-height:1.4;">${doc.content}</div>
        </div>
      `).join("");
    } catch (e) {
      vectorResultsArea.innerHTML = `<div style='color:#f87171'>Search error: ${e.message}</div>`;
    }
  }

  // 8. Modals: GCP Deployment Guide Modal
  const btnOpenGcp = document.getElementById("btn-open-gcp-deploy");
  const btnCloseGcp = document.getElementById("btn-close-gcp-modal");
  btnOpenGcp?.addEventListener("click", () => gcpModal.classList.add("active"));
  btnCloseGcp?.addEventListener("click", () => gcpModal.classList.remove("active"));

  // 9. Modals: Settings & LLM Config
  const btnOpenConfig = document.getElementById("btn-open-config");
  const btnCloseConfig = document.getElementById("btn-close-config-modal");
  const btnSaveConfig = document.getElementById("btn-save-config");
  const apiKeyInput = document.getElementById("config-api-key");
  const modelSelect = document.getElementById("config-model-select");

  btnOpenConfig?.addEventListener("click", () => configModal.classList.add("active"));
  btnCloseConfig?.addEventListener("click", () => configModal.classList.remove("active"));

  btnSaveConfig?.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    try {
      const res = await fetch("/api/config/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key || null, model }),
      });
      const data = await res.json();
      configModal.classList.remove("active");
      await loadSystemStatus();
      alert(`Settings updated! Engine mode: ${data.mode}`);
    } catch (e) {
      alert(`Failed to save configuration: ${e.message}`);
    }
  });

  // Initial Load
  loadSystemStatus();
  loadScenarios();
  setActiveTab("tab-plan");
});
