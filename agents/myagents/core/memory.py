"""
core/memory.py
Conversational State Retention and Blackboard Shared Memory Architecture.
Maintains short-term mission state, agent message traces, and artifacts.
"""

import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class AgentMessage(BaseModel):
    id: str
    timestamp: float = Field(default_factory=time.time)
    agent_id: str
    agent_name: str
    role: str
    message_type: str  # "thought", "tool_call", "tool_result", "statement", "critique", "artifact"
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class MissionMemory:
    """Working memory and blackboard for a single multi-agent mission."""
    def __init__(self, mission_id: str, objective: str):
        self.mission_id: str = mission_id
        self.objective: str = objective
        self.created_at: float = time.time()
        self.updated_at: float = time.time()
        self.status: str = "initialized"  # "initialized", "planning", "executing", "evaluating", "completed", "failed"
        
        # Blackboard stores structured outputs keyed by task or agent
        self.blackboard: Dict[str, Any] = {
            "research_findings": [],
            "architecture_blueprint": None,
            "code_artifacts": {},
            "critique_evaluation": None,
            "final_deliverable": None,
            "presentation_deck": None,
        }
        
        # Message trail
        self.messages: List[AgentMessage] = []
        
        # Contextual variables and flags
        self.context: Dict[str, Any] = {}

    def log(self, agent_id: str, agent_name: str, role: str, message_type: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> AgentMessage:
        """Append an agent action/message to the trace."""
        msg_id = f"msg_{len(self.messages) + 1}_{int(time.time() * 1000)}"
        msg = AgentMessage(
            id=msg_id,
            agent_id=agent_id,
            agent_name=agent_name,
            role=role,
            message_type=message_type,
            content=content,
            metadata=metadata or {},
        )
        self.messages.append(msg)
        self.updated_at = time.time()
        return msg

    def set_blackboard(self, key: str, value: Any):
        """Update shared blackboard item."""
        self.blackboard[key] = value
        self.updated_at = time.time()

    def get_blackboard(self, key: str, default: Any = None) -> Any:
        """Read shared blackboard item."""
        return self.blackboard.get(key, default)

    def get_recent_history(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Return serialized list of recent agent messages."""
        return [msg.model_dump() for msg in self.messages[-limit:]]

    def to_dict(self) -> Dict[str, Any]:
        """Serialize complete mission memory."""
        return {
            "mission_id": self.mission_id,
            "objective": self.objective,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "message_count": len(self.messages),
            "messages": [m.model_dump() for m in self.messages],
            "blackboard": self.blackboard,
            "context": self.context,
        }
