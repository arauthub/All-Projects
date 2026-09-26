"""
core/tools.py
Autonomous Tool Definitions and Execution Registry for Multi-Agent System.
Supports deterministic function calling, vector retrieval, and code evaluation.
"""

import ast
import json
import math
from typing import Dict, Any, Callable, List, Optional
from core.vector_store import VectorStore

class ToolRegistry:
    def __init__(self, vector_store: Optional[VectorStore] = None):
        self.vector_store = vector_store or VectorStore()
        self.tools: Dict[str, Dict[str, Any]] = {}
        self._register_default_tools()

    def register(self, name: str, description: str, parameters: Dict[str, Any], func: Callable):
        """Register a tool with its JSON schema and execution handler."""
        self.tools[name] = {
            "name": name,
            "description": description,
            "parameters": parameters,
            "handler": func,
        }

    def execute(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a registered tool by name with arguments."""
        if name not in self.tools:
            return {
                "success": False,
                "error": f"Tool '{name}' not found in registry.",
                "available_tools": list(self.tools.keys()),
            }
        try:
            handler = self.tools[name]["handler"]
            result = handler(**arguments)
            return {
                "success": True,
                "tool": name,
                "arguments": arguments,
                "result": result,
            }
        except Exception as e:
            return {
                "success": False,
                "tool": name,
                "arguments": arguments,
                "error": str(e),
            }

    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        """Return list of tool declarations compatible with Google ADK / Gemini function calling."""
        return [
            {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["parameters"],
            }
            for t in self.tools.values()
        ]

    def _register_default_tools(self):
        # 1. Vector Store Search Tool
        self.register(
            name="vector_search",
            description="Query the enterprise knowledge base using semantic cosine similarity to retrieve architecture guides, security standards, and GCP best practices.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query or keyword statement"},
                    "top_k": {"type": "integer", "description": "Number of matching documents to return (default 3)"},
                },
                "required": ["query"],
            },
            func=self._tool_vector_search,
        )

        # 2. Math & Capacity Planning Calculator
        self.register(
            name="capacity_calculator",
            description="Perform safe mathematical calculations for QPS, bandwidth, database sizing, memory headroom, or GCP cost estimates.",
            parameters={
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Mathematical expression (e.g. '10000000 / 86400 * 1.5')"},
                },
                "required": ["expression"],
            },
            func=self._tool_calculator,
        )

        # 3. Python Code Syntax Validator
        self.register(
            name="code_syntax_validator",
            description="Validate Python code syntax, imports, and AST structure before deployment.",
            parameters={
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "The Python source code to validate"},
                },
                "required": ["code"],
            },
            func=self._tool_code_validator,
        )

        # 4. External Cloud Service Mock API
        self.register(
            name="cloud_service_query",
            description="Query simulated cloud service telemetry, GCP region availability, or latency benchmarks.",
            parameters={
                "type": "object",
                "properties": {
                    "service": {"type": "string", "description": "Cloud service name (e.g. 'cloud-run', 'spanner', 'pubsub', 'secret-manager')"},
                    "metric": {"type": "string", "description": "Metric to inspect ('sla', 'pricing', 'latency', 'regions')"},
                },
                "required": ["service"],
            },
            func=self._tool_cloud_service_query,
        )

        # 5. Architecture Mermaid Diagram Formatter
        self.register(
            name="generate_mermaid_diagram",
            description="Generate formatted Mermaid.js syntax for visual system architecture or agent sequence diagrams.",
            parameters={
                "type": "object",
                "properties": {
                    "diagram_type": {"type": "string", "description": "'graph' or 'sequenceDiagram'"},
                    "title": {"type": "string", "description": "Diagram title"},
                    "nodes": {"type": "array", "items": {"type": "string"}, "description": "List of node connections, e.g. ['Client --> CloudRun', 'CloudRun --> Spanner']"},
                },
                "required": ["diagram_type", "nodes"],
            },
            func=self._tool_generate_mermaid,
        )

    def _tool_vector_search(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        results = self.vector_store.search(query, top_k=top_k)
        return {
            "query": query,
            "match_count": len(results),
            "documents": results,
        }

    def _tool_calculator(self, expression: str) -> Dict[str, Any]:
        allowed_names = {"math": math, "min": min, "max": max, "abs": abs, "round": round}
        # Compile and check AST to ensure safe evaluation (no __import__, os, etc.)
        tree = ast.parse(expression, mode='eval')
        for node in ast.walk(tree):
            if isinstance(node, (ast.Call, ast.Attribute)):
                if isinstance(node, ast.Call) and not isinstance(node.func, ast.Name):
                    raise ValueError("Nested function calls not permitted in calculator.")
        val = eval(compile(tree, "<calc>", "eval"), {"__builtins__": None}, allowed_names)
        return {"expression": expression, "result": val}

    def _tool_code_validator(self, code: str) -> Dict[str, Any]:
        try:
            tree = ast.parse(code)
            functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
            classes = [node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
            return {
                "valid": True,
                "message": "Syntax verification passed without errors.",
                "classes_found": classes,
                "functions_found": functions,
                "loc": len(code.splitlines()),
            }
        except SyntaxError as e:
            return {
                "valid": False,
                "error": str(e),
                "lineno": e.lineno,
                "offset": e.offset,
            }

    def _tool_cloud_service_query(self, service: str, metric: str = "sla") -> Dict[str, Any]:
        telemetry_db = {
            "cloud-run": {
                "sla": "99.95% Availability",
                "pricing": "$0.00002400 per vCPU-second, $0.00000250 per GiB-second, with 2M free requests/month",
                "latency": "Cold start: 120ms-450ms, Warm latency: 8ms-22ms",
                "regions": ["us-central1 (Iowa)", "us-east1 (S. Carolina)", "europe-west1 (Belgium)", "asia-south1 (Mumbai)"],
            },
            "spanner": {
                "sla": "99.999% Multi-Region High Availability",
                "pricing": "$0.90 per node-hour (or $0.09 per 100 processing units)",
                "latency": "P99 Read: <5ms, P99 Write: <10ms global consistency",
                "regions": ["Global Multi-Region (nam-eur-asia)", "Regional configurations available worldwide"],
            },
            "pubsub": {
                "sla": "99.95% Service Level Agreement",
                "pricing": "$40 per TiB of message volume (first 10 GiB/month free)",
                "latency": "End-to-end publish-to-subscriber latency: 15ms-40ms",
                "regions": ["Global Anycast (automatic global data replication)"],
            },
            "secret-manager": {
                "sla": "99.95% Service Level Agreement",
                "pricing": "$0.06 per 10,000 access operations, $0.18 per active secret version/month",
                "latency": "Access latency: <12ms",
                "regions": ["Global & Regional replication options"],
            },
        }
        svc = service.lower().replace(" ", "-")
        info = telemetry_db.get(svc, {
            "sla": "99.9% Standard Cloud SLA",
            "pricing": "Pay-as-you-go standard cloud pricing tier",
            "latency": "Typical sub-50ms regional latency",
            "regions": ["Global Tier 1 Regions"],
        })
        return {
            "service": service,
            "metric_requested": metric,
            "metric_value": info.get(metric, info),
            "all_metrics": info,
        }

    def _tool_generate_mermaid(self, diagram_type: str, nodes: List[str], title: Optional[str] = None) -> Dict[str, Any]:
        header = f"graph TD\n" if diagram_type == "graph" else f"{diagram_type}\n"
        if title:
            header += f"    %% Title: {title}\n"
        body = "\n".join(f"    {n}" for n in nodes)
        full_syntax = f"{header}{body}"
        return {
            "diagram_type": diagram_type,
            "mermaid_syntax": full_syntax,
        }
