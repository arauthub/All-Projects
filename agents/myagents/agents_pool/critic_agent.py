"""
agents_pool/critic_agent.py
Critic & Adversarial Reviewer Agent: Audits proposals for security, latency, and quality.
"""

from core.base_agent import BaseAgent
from core.tools import ToolRegistry
from core.llm_adapter import LLMAdapter

class CriticAgent(BaseAgent):
    def __init__(self, tool_registry: ToolRegistry, llm_adapter: LLMAdapter):
        super().__init__(
            agent_id="critic",
            name="Sentinel Auditor",
            role="Adversarial Quality, Security & Cost Auditor",
            icon="🛡️",
            color="#f59e0b",  # Amber
            system_instruction=(
                "You are the Adversarial Reviewer and Security Auditor (Sentinel Auditor). You critically evaluate "
                "proposed architectures for single points of failure, cold start bottlenecks, cost overrun risks, "
                "and compliance shortcomings. You calculate a quantitative quality score (0-100) and prescribe concrete mitigations."
            ),
            tool_registry=tool_registry,
            llm_adapter=llm_adapter,
        )
