/**
 * app/static/js/graph.js
 * Multi-Agent DAG Pipeline Visualizer with Active Pulse Telemetry and Filtering.
 */

class DAGVisualizer {
  constructor(containerId, onAgentClick) {
    this.container = document.getElementById(containerId);
    this.onAgentClick = onAgentClick;
    this.agents = [
      { id: "orchestrator", name: "Nexus Commander", role: "Mission Orchestration", icon: "🧠", color: "#6366f1" },
      { id: "researcher", name: "Scout Intelligence", role: "Vector RAG & Sizing", icon: "🔍", color: "#06b6d4" },
      { id: "architect", name: "Vanguard Architect", role: "Cloud Systems & Mermaid", icon: "🏛️", color: "#10b981" },
      { id: "critic", name: "Sentinel Auditor", role: "Adversarial Quality & SOC2", icon: "🛡️", color: "#f59e0b" },
      { id: "synthesizer", name: "Aegis Synthesizer", role: "Deliverable & Slides Deck", icon: "🎯", color: "#ec4899" },
    ];
    this.activeAgentId = null;
    this.completedAgentIds = new Set();
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";

    this.agents.forEach((agent, index) => {
      // Create agent node card
      const nodeEl = document.createElement("div");
      nodeEl.className = "agent-node";
      nodeEl.id = `node-${agent.id}`;
      nodeEl.style.setProperty("--node-color", agent.color);
      nodeEl.style.setProperty("--node-glow", `${agent.color}55`);

      if (this.activeAgentId === agent.id) nodeEl.classList.add("active");
      if (this.completedAgentIds.has(agent.id)) nodeEl.classList.add("completed");

      const statusText = this.activeAgentId === agent.id ? "Thinking" : (this.completedAgentIds.has(agent.id) ? "Done" : "Idle");

      nodeEl.innerHTML = `
        <div class="node-icon-circle">${agent.icon}</div>
        <div class="node-title">${agent.name}</div>
        <div class="node-role">${agent.role}</div>
        <div class="node-status-badge" id="badge-${agent.id}">${statusText}</div>
      `;

      nodeEl.addEventListener("click", () => {
        if (this.onAgentClick) this.onAgentClick(agent.id);
      });

      this.container.appendChild(nodeEl);

      // Add connecting flow arrow if not last node
      if (index < this.agents.length - 1) {
        const arrowEl = document.createElement("div");
        arrowEl.className = "dag-arrow";
        arrowEl.innerHTML = "➔";
        this.container.appendChild(arrowEl);
      }
    });
  }

  setActiveAgent(agentId) {
    if (this.activeAgentId && this.activeAgentId !== agentId) {
      this.completedAgentIds.add(this.activeAgentId);
    }
    this.activeAgentId = agentId;
    this.updateNodes();
  }

  setAgentCompleted(agentId) {
    this.completedAgentIds.add(agentId);
    if (this.activeAgentId === agentId) {
      this.activeAgentId = null;
    }
    this.updateNodes();
  }

  reset() {
    this.activeAgentId = null;
    this.completedAgentIds.clear();
    this.updateNodes();
  }

  updateNodes() {
    this.agents.forEach(agent => {
      const nodeEl = document.getElementById(`node-${agent.id}`);
      const badgeEl = document.getElementById(`badge-${agent.id}`);
      if (!nodeEl || !badgeEl) return;

      nodeEl.classList.remove("active", "completed");

      if (this.activeAgentId === agent.id) {
        nodeEl.classList.add("active");
        badgeEl.textContent = "Active";
      } else if (this.completedAgentIds.has(agent.id)) {
        nodeEl.classList.add("completed");
        badgeEl.textContent = "Done";
      } else {
        badgeEl.textContent = "Idle";
      }
    });
  }
}
