"""
agents_pool/architect_agent.py
Architect & Systems Engineer Agent: Designs Cloud Microservices & Mermaid Diagrams.
"""

from core.base_agent import BaseAgent
from core.tools import ToolRegistry
from core.llm_adapter import LLMAdapter

class ArchitectAgent(BaseAgent):
    def __init__(self, tool_registry: ToolRegistry, llm_adapter: LLMAdapter):
        super().__init__(
            agent_id="architect",
            name="Vanguard Architect",
            role="Cloud Systems & Microservices Architect",
            icon="🏛️",
            color="#10b981",  # Emerald Green
            system_instruction=(
                "You are the Lead Systems Architect (Vanguard Architect). You transform research inputs into "
                "fault-tolerant, scalable cloud architectures. You generate Mermaid.js topology diagrams, specify "
                "microservice boundaries, asynchronous queues, and database schemas with extreme technical precision."
            ),
            tool_registry=tool_registry,
            llm_adapter=llm_adapter,
        )
