"""
tests/test_orchestrator.py
End-to-End integration tests for MultiAgentOrchestrator and Presentation Deck generation.
"""

import unittest
from core.orchestrator import MultiAgentOrchestrator

class TestOrchestrator(unittest.TestCase):
    def setUp(self):
        self.orchestrator = MultiAgentOrchestrator()

    def test_agent_swarm_initialization(self):
        agents = self.orchestrator.get_agent_specs()
        self.assertEqual(len(agents), 5)
        agent_ids = [a["id"] for a in agents]
        self.assertIn("orchestrator", agent_ids)
        self.assertIn("researcher", agent_ids)
        self.assertIn("architect", agent_ids)
        self.assertIn("critic", agent_ids)
        self.assertIn("synthesizer", agent_ids)

    def test_full_mission_lifecycle(self):
        memory = self.orchestrator.create_mission(
            objective="Design a multi-region cloud microservice for 10M users on GCP"
        )
        self.assertEqual(memory.status, "initialized")

        events = list(self.orchestrator.execute_mission(memory.mission_id))
        self.assertGreater(len(events), 20)
        self.assertEqual(memory.status, "completed")

        # Verify blackboard artifacts
        self.assertIsNotNone(memory.get_blackboard("research_findings"))
        self.assertIsNotNone(memory.get_blackboard("architecture_blueprint"))
        self.assertIsNotNone(memory.get_blackboard("critique_evaluation"))
        self.assertIsNotNone(memory.get_blackboard("final_deliverable"))

        # Verify presentation deck slides generated
        deck = memory.get_blackboard("presentation_deck")
        self.assertIsInstance(deck, list)
        self.assertGreaterEqual(len(deck), 5)
        self.assertIn("title", deck[0])
        self.assertIn("points", deck[0])

if __name__ == "__main__":
    unittest.main()
