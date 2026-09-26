"""
tests/test_tools.py
Unit tests for Autonomous Tool Registry and execution handlers.
"""

import unittest
from core.tools import ToolRegistry

class TestTools(unittest.TestCase):
    def setUp(self):
        self.registry = ToolRegistry()

    def test_tool_schemas_registered(self):
        schemas = self.registry.get_tool_schemas()
        tool_names = [s["name"] for s in schemas]
        self.assertIn("vector_search", tool_names)
        self.assertIn("capacity_calculator", tool_names)
        self.assertIn("code_syntax_validator", tool_names)
        self.assertIn("generate_mermaid_diagram", tool_names)

    def test_capacity_calculator(self):
        res = self.registry.execute("capacity_calculator", {"expression": "10000000 / 86400 * 2.5"})
        self.assertTrue(res["success"])
        self.assertAlmostEqual(res["result"]["result"], 289.35, places=1)

    def test_code_syntax_validator_valid(self):
        valid_code = "def handle_request(event, context):\n    return {'status': 200}\n"
        res = self.registry.execute("code_syntax_validator", {"code": valid_code})
        self.assertTrue(res["success"])
        self.assertTrue(res["result"]["valid"])
        self.assertIn("handle_request", res["result"]["functions_found"])

    def test_code_syntax_validator_invalid(self):
        invalid_code = "def broken_func(\n    missing closing paren"
        res = self.registry.execute("code_syntax_validator", {"code": invalid_code})
        self.assertTrue(res["success"])
        self.assertFalse(res["result"]["valid"])

    def test_generate_mermaid_diagram(self):
        res = self.registry.execute("generate_mermaid_diagram", {
            "diagram_type": "graph",
            "nodes": ["A --> B", "B --> C"],
            "title": "Pipeline Graph"
        })
        self.assertTrue(res["success"])
        self.assertIn("graph TD", res["result"]["mermaid_syntax"])
        self.assertIn("A --> B", res["result"]["mermaid_syntax"])

if __name__ == "__main__":
    unittest.main()
