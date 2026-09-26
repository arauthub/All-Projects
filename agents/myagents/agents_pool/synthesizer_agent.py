"""
agents_pool/synthesizer_agent.py
Synthesizer & Executive Delivery Agent: Assembles final deliverables and creates presentations.
"""

from core.base_agent import BaseAgent
from core.tools import ToolRegistry
from core.llm_adapter import LLMAdapter

class SynthesizerAgent(BaseAgent):
    def __init__(self, tool_registry: ToolRegistry, llm_adapter: LLMAdapter):
        super().__init__(
            agent_id="synthesizer",
            name="Aegis Synthesizer",
            role="Executive Deliverable & Presentation Specialist",
            icon="🎯",
            color="#ec4899",  # Pink
            system_instruction=(
                "You are the Executive Synthesizer (Aegis Synthesizer). You compile findings, blueprints, and audits "
                "from across the agent swarm into an authoritative executive briefing and structured high-impact "
                "presentation slides ready for stakeholders and engineering leadership."
            ),
            tool_registry=tool_registry,
            llm_adapter=llm_adapter,
        )
