"""
core/base_agent.py
Base Agent Abstraction for Google ADK Architecture.
Encapsulates personality, memory access, autonomous tool execution, and telemetry.
"""

from typing import Dict, Any, List, Optional
from core.tools import ToolRegistry
from core.memory import MissionMemory, AgentMessage
from core.llm_adapter import LLMAdapter

class BaseAgent:
    def __init__(
        self,
        agent_id: str,
        name: str,
        role: str,
        icon: str,
        color: str,
        system_instruction: str,
        tool_registry: ToolRegistry,
        llm_adapter: LLMAdapter,
    ):
        self.agent_id: str = agent_id
        self.name: str = name
        self.role: str = role
        self.icon: str = icon
        self.color: str = color
        self.system_instruction: str = system_instruction
        self.tool_registry: ToolRegistry = tool_registry
        self.llm_adapter: LLMAdapter = llm_adapter
        self.status: str = "idle"  # "idle", "thinking", "tool_executing", "completed", "error"

    def execute_task(self, task_description: str, memory: MissionMemory) -> List[AgentMessage]:
        """
        Execute an assigned task.
        Emits thoughts, executes any required tool calls, and returns emitted messages.
        """
        self.status = "thinking"
        emitted_messages: List[AgentMessage] = []
        executed_tools: List[str] = []
        context_data: Dict[str, Any] = {
            "executed_tools": executed_tools,
            "blackboard": memory.blackboard,
        }

        # Multi-step tool execution loop (up to 3 iterations for multi-tool chaining)
        for step_idx in range(3):
            step_result = self.llm_adapter.generate_agent_step(
                agent_id=self.agent_id,
                agent_name=self.name,
                role=self.role,
                system_instruction=self.system_instruction,
                objective=memory.objective,
                task_description=task_description,
                context_data=context_data,
                tools_available=self.tool_registry.get_tool_schemas(),
                message_history=memory.get_recent_history(),
            )

            # 1. Log thought if present
            if step_result.get("thought"):
                thought_msg = memory.log(
                    agent_id=self.agent_id,
                    agent_name=self.name,
                    role=self.role,
                    message_type="thought",
                    content=step_result["thought"],
                    metadata={"step": step_idx + 1},
                )
                emitted_messages.append(thought_msg)

            # 2. Check if agent called a tool
            tool_call = step_result.get("tool_call")
            if tool_call:
                tool_name = tool_call["name"]
                tool_args = tool_call.get("arguments", {})
                self.status = "tool_executing"

                # Log tool call action
                call_msg = memory.log(
                    agent_id=self.agent_id,
                    agent_name=self.name,
                    role=self.role,
                    message_type="tool_call",
                    content=f"Invoking `{tool_name}` with arguments: `{tool_args}`",
                    metadata={"tool": tool_name, "arguments": tool_args},
                )
                emitted_messages.append(call_msg)

                # Execute tool
                tool_res = self.tool_registry.execute(tool_name, tool_args)
                executed_tools.append(tool_name)

                # Update context data for next step
                if tool_name == "vector_search" and tool_res["success"]:
                    context_data["vector_docs"] = tool_res["result"]["documents"]
                elif tool_name == "capacity_calculator" and tool_res["success"]:
                    context_data["calc_result"] = tool_res["result"]["result"]
                elif tool_name == "generate_mermaid_diagram" and tool_res["success"]:
                    context_data["diagram"] = tool_res["result"]["mermaid_syntax"]

                # Log tool result
                res_content = str(tool_res.get("result") or tool_res.get("error"))
                if len(res_content) > 300:
                    res_content_preview = res_content[:300] + "... [truncated]"
                else:
                    res_content_preview = res_content

                res_msg = memory.log(
                    agent_id=self.agent_id,
                    agent_name=self.name,
                    role=self.role,
                    message_type="tool_result",
                    content=f"Tool `{tool_name}` result:\n```json\n{res_content_preview}\n```",
                    metadata={"tool_execution": tool_res},
                )
                emitted_messages.append(res_msg)

                # Continue loop to allow agent to reason about tool result
                continue

            # 3. Final response from agent
            final_response = step_result.get("final_response")
            if final_response:
                resp_msg = memory.log(
                    agent_id=self.agent_id,
                    agent_name=self.name,
                    role=self.role,
                    message_type="statement",
                    content=final_response,
                    metadata={"status": "completed"},
                )
                emitted_messages.append(resp_msg)

                # Store deliverables in blackboard
                if self.agent_id == "researcher":
                    memory.set_blackboard("research_findings", final_response)
                elif self.agent_id == "architect":
                    memory.set_blackboard("architecture_blueprint", final_response)
                elif self.agent_id == "critic":
                    memory.set_blackboard("critique_evaluation", {
                        "score": step_result.get("audit_score", 94),
                        "status": step_result.get("status", "APPROVED"),
                        "critique": final_response,
                    })
                elif self.agent_id == "synthesizer":
                    memory.set_blackboard("final_deliverable", final_response)
                    if step_result.get("presentation_deck"):
                        memory.set_blackboard("presentation_deck", step_result["presentation_deck"])

                break

        self.status = "completed"
        return emitted_messages

    def to_dict(self) -> Dict[str, Any]:
        """Serialize agent specification."""
        return {
            "id": self.agent_id,
            "name": self.name,
            "role": self.role,
            "icon": self.icon,
            "color": self.color,
            "status": self.status,
            "system_instruction": self.system_instruction,
        }
