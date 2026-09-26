"""
agents_pool/orchestrator_agent.py
Commander & Supervisor Agent: Decomposes mission into tasks, coordinates execution DAG.
"""

from core.base_agent import BaseAgent
from core.tools import ToolRegistry
from core.llm_adapter import LLMAdapter

class OrchestratorAgent(BaseAgent):
    def __init__(self, tool_registry: ToolRegistry, llm_adapter: LLMAdapter):
        super().__init__(
            agent_id="orchestrator",
            name="Nexus Commander",
            role="Mission Orchestrator & Task Decomposer",
            icon="🧠",
            color="#6366f1",  # Indigo
            system_instruction=(
                "You are the lead Multi-Agent Orchestrator (Nexus Commander). You analyze user mission objectives, "
                "decompose complex requirements into atomic, sequential or parallel tasks, assign them to domain specialist agents, "
                "and ensure all dependency contracts and shared blackboard states are maintained."
            ),
            tool_registry=tool_registry,
            llm_adapter=llm_adapter,
        )
