"""
core/orchestrator.py
Multi-Agent Orchestrator Framework (Google ADK Architecture).
Manages agent registration, task DAG lifecycle, blackboard state, and real-time execution streaming.
"""

import time
import uuid
from typing import Dict, Any, List, Optional, Generator
from core.vector_store import VectorStore
from core.tools import ToolRegistry
from core.memory import MissionMemory, AgentMessage
from core.llm_adapter import LLMAdapter

from agents_pool.orchestrator_agent import OrchestratorAgent
from agents_pool.researcher_agent import ResearcherAgent
from agents_pool.architect_agent import ArchitectAgent
from agents_pool.critic_agent import CriticAgent
from agents_pool.synthesizer_agent import SynthesizerAgent

class MultiAgentOrchestrator:
    def __init__(self, api_key: Optional[str] = None):
        self.vector_store = VectorStore()
        self.tool_registry = ToolRegistry(vector_store=self.vector_store)
        self.llm_adapter = LLMAdapter(api_key=api_key)

        # Initialize Specialized Agents
        self.agents: Dict[str, Any] = {
            "orchestrator": OrchestratorAgent(self.tool_registry, self.llm_adapter),
            "researcher": ResearcherAgent(self.tool_registry, self.llm_adapter),
            "architect": ArchitectAgent(self.tool_registry, self.llm_adapter),
            "critic": CriticAgent(self.tool_registry, self.llm_adapter),
            "synthesizer": SynthesizerAgent(self.tool_registry, self.llm_adapter),
        }

        # Active & Historical Missions
        self.missions: Dict[str, MissionMemory] = {}

    def get_agent_specs(self) -> List[Dict[str, Any]]:
        """Return specifications of all registered agents."""
        return [agent.to_dict() for agent in self.agents.values()]

    def create_mission(self, objective: str, mission_id: Optional[str] = None) -> MissionMemory:
        """Initialize a new multi-agent mission with working memory."""
        m_id = mission_id or f"mission_{int(time.time())}_{str(uuid.uuid4())[:6]}"
        memory = MissionMemory(mission_id=m_id, objective=objective)
        self.missions[m_id] = memory
        return memory

    def get_mission(self, mission_id: str) -> Optional[MissionMemory]:
        """Fetch mission memory by ID."""
        return self.missions.get(mission_id)

    def execute_mission(self, mission_id: str) -> Generator[Dict[str, Any], None, None]:
        """
        Execute full multi-agent mission workflow sequentially through DAG.
        Yields live event updates for WebSocket / SSE real-time streaming.
        """
        memory = self.get_mission(mission_id)
        if not memory:
            yield {"type": "error", "message": f"Mission '{mission_id}' not found."}
            return

        memory.status = "executing"
        yield {
            "type": "mission_started",
            "mission_id": mission_id,
            "objective": memory.objective,
            "timestamp": time.time(),
        }

        # Defined topological execution sequence
        pipeline = [
            ("orchestrator", "Decompose the user mission objective into atomic tasks, assign domain agents, and establish execution DAG."),
            ("researcher", "Retrieve relevant cloud architecture patterns, capacity benchmarks, and zero-trust standards from vector store."),
            ("architect", "Engineer the comprehensive production cloud architecture, microservices topology, and Mermaid diagram."),
            ("critic", "Conduct rigorous adversarial audit evaluating security, latency, cold starts, and cost optimization."),
            ("synthesizer", "Consolidate all findings into final executive briefing and generate interactive presentation slides."),
        ]

        total_steps = len(pipeline)
        for step_idx, (agent_id, task_desc) in enumerate(pipeline, start=1):
            agent = self.agents.get(agent_id)
            if not agent:
                continue

            yield {
                "type": "agent_activated",
                "mission_id": mission_id,
                "agent_id": agent_id,
                "agent_name": agent.name,
                "step": step_idx,
                "total_steps": total_steps,
                "task": task_desc,
            }

            # Execute agent task and emit each message
            messages = agent.execute_task(task_desc, memory)
            for msg in messages:
                yield {
                    "type": "agent_message",
                    "mission_id": mission_id,
                    "agent_id": agent_id,
                    "message": msg.model_dump(),
                }
                # Brief pacing for realistic streaming feel in UI
                time.sleep(0.05)

            yield {
                "type": "agent_completed",
                "mission_id": mission_id,
                "agent_id": agent_id,
                "agent_name": agent.name,
                "step": step_idx,
                "blackboard": memory.blackboard,
            }

        memory.status = "completed"
        yield {
            "type": "mission_completed",
            "mission_id": mission_id,
            "deliverable": memory.get_blackboard("final_deliverable"),
            "presentation_deck": memory.get_blackboard("presentation_deck"),
            "full_memory": memory.to_dict(),
        }

    def get_demo_scenarios(self) -> List[Dict[str, Any]]:
        """Pre-configured enterprise multi-agent demo scenarios."""
        return [
            {
                "id": "gcp-cloud-architecture",
                "title": "🌐 High-Scale Enterprise Cloud Architecture (10M Users)",
                "description": "Orchestrates multi-agent swarm to design an auto-scaling, zero-trust cloud backend on GCP with Cloud Run, Spanner, and Pub/Sub.",
                "objective": "Architect a fault-tolerant, auto-scaling enterprise cloud platform on Google Cloud Platform to support 10 million daily active requests with sub-100ms global latency and SOC2 Type II compliance.",
                "recommended_agents": ["Nexus Commander", "Scout Intelligence", "Vanguard Architect", "Sentinel Auditor", "Aegis Synthesizer"],
            },
            {
                "id": "zero-day-triage",
                "title": "🛡️ Autonomous Zero-Day Vulnerability Triage & Automated Patching",
                "description": "Multi-agent cybersecurity pipeline analyzing threat vectors, assessing blast radius, generating mitigation patches, and auditing safety.",
                "objective": "Triage a critical remote code execution vulnerability detected in API gateway ingress, evaluate blast radius across microservices, generate hotfix patch, and verify safety.",
                "recommended_agents": ["Nexus Commander", "Scout Intelligence", "Vanguard Architect", "Sentinel Auditor", "Aegis Synthesizer"],
            },
            {
                "id": "multi-agent-support-swarm",
                "title": "🤖 Autonomous AI Multi-Agent Support Swarm with RAG",
                "description": "Multi-agent collaborative system for enterprise customer inquiries, billing reconciliations, and ticket resolution with reflection loops.",
                "objective": "Deploy a multi-tier customer support agent swarm capable of intent classification, vector store knowledge retrieval, policy compliance checks, and personalized executive synthesis.",
                "recommended_agents": ["Nexus Commander", "Scout Intelligence", "Vanguard Architect", "Sentinel Auditor", "Aegis Synthesizer"],
            },
        ]
