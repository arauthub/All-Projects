"""Unit tests for WorkspaceCurator Curation & NLP Analysis Engine."""

import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models import WorkspaceProduct, UrgencyLevel, SentimentType
from app.analyzer.engine import analyzer
from app.curation.formatter import CurationFormatter


class TestCurationEngine(unittest.TestCase):
    def test_critical_urgency_detection(self):
        text = "SEV-1 ALERT: Frankfurt API gateway outage causing customer SLA breach!"
        item = analyzer.analyze(
            product=WorkspaceProduct.GMAIL,
            title="P0 Production Incident",
            sender="oncall@enterprise.com",
            raw_content=text
        )

        self.assertEqual(item.urgency, UrgencyLevel.CRITICAL)
        self.assertGreaterEqual(item.urgency_score, 90)
        self.assertEqual(item.sentiment, SentimentType.URGENT)

    def test_action_item_extraction(self):
        text = """
        Meeting Notes & Roadmap Review:
        - [ ] TODO: @Marcus to finalize multi-region Terraform setup by Friday.
        - Action Item: @Priya to coordinate legal compliance review before Oct 15.
        - Normal commentary without actions.
        """
        item = analyzer.analyze(
            product=WorkspaceProduct.DOCS,
            title="Q3 Strategy Meeting",
            sender="lead@enterprise.com",
            raw_content=text
        )

        self.assertGreaterEqual(len(item.action_items), 2)
        marcus_action = next((a for a in item.action_items if "Marcus" in (a.assignee or "")), None)
        self.assertIsNotNone(marcus_action)
        self.assertIn("Friday", marcus_action.deadline or "")

    def test_metric_and_entity_extraction(self):
        text = "Approved Q3 budget of $1,450,000 USD representing 34% increase in AWS cloud spend."
        item = analyzer.analyze(
            product=WorkspaceProduct.SHEETS,
            title="Financial Model",
            sender="finance@enterprise.com",
            raw_content=text
        )

        self.assertTrue(any("$1,450,000" in m for m in item.metrics))
        self.assertTrue(any("34%" in m for m in item.metrics))
        self.assertTrue(any(e.name == "AWS" for e in item.entities))

    def test_formatting_outputs(self):
        item = analyzer.analyze(
            product=WorkspaceProduct.DOCS,
            title="Product Launch Briefing",
            sender="pm@enterprise.com",
            raw_content="Launched global v2.0 feature achieving $500k ARR. - [ ] @Sarah to verify telemetry by tomorrow."
        )

        formats = CurationFormatter.generate_all(item)
        self.assertIn("markdown", formats)
        self.assertIn("slack", formats)
        self.assertIn("email", formats)
        self.assertIn("json_ld", formats)

        # Markdown checks
        self.assertIn("# ", formats["markdown"])
        self.assertIn("Executive Summary", formats["markdown"])
        self.assertIn("@Sarah", formats["markdown"])

        # Slack checks
        self.assertIn("*Google Docs:", formats["slack"])


if __name__ == "__main__":
    unittest.main()
