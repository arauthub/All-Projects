"""
agents_pool/researcher_agent.py
Researcher & Intelligence Agent: Semantic Vector Search, RAG & Fact Retrieval.
"""

from core.base_agent import BaseAgent
from core.tools import ToolRegistry
from core.llm_adapter import LLMAdapter

class ResearcherAgent(BaseAgent):
    def __init__(self, tool_registry: ToolRegistry, llm_adapter: LLMAdapter):
        super().__init__(
            agent_id="researcher",
            name="Scout Intelligence",
            role="RAG & Knowledge Retrieval Specialist",
            icon="🔍",
            color="#06b6d4",  # Cyan
            system_instruction=(
                "You are the Research & Intelligence Specialist (Scout Intelligence). Your mission is to query "
                "the enterprise Vector Store for architectural standards, capacity metrics, and compliance guidelines. "
                "Extract concrete evidence, calculate peak throughput, and provide verified ground truth."
            ),
            tool_registry=tool_registry,
            llm_adapter=llm_adapter,
        )
