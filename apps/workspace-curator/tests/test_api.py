"""API endpoint integration tests for WorkspaceCurator Pro."""

import unittest
import sys
from pathlib import Path
from starlette.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.database import db


class TestWorkspaceCuratorAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_and_index_html(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("WorkspaceCurator Pro", res.text)

    def test_stats_endpoint(self):
        res = self.client.get("/api/v1/stats")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_curated", data)
        self.assertIn("by_product", data)

    def test_simulation_endpoint(self):
        payload = {
            "product": "docs",
            "source_title": "Automated Test Strategy Document",
            "source_sender": "qa-lead@enterprise.com",
            "source_url": "https://docs.google.com/document/d/test1234/edit",
            "content": "Test specification for WorkspaceCurator. Target 100% test coverage with $50k allocation. - [ ] @Alex to run CI presubmit by EOD."
        }
        res = self.client.post("/api/v1/simulate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["product"], "docs")
        self.assertEqual(data["source_title"], "Automated Test Strategy Document")
        self.assertIn("summary", data)
        self.assertIn("formats", data)
        self.assertIn("markdown", data["formats"])

        item_id = data["id"]

        # Fetch single item
        get_res = self.client.get(f"/api/v1/curated/{item_id}")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["id"], item_id)

        # Export format
        md_res = self.client.get(f"/api/v1/curated/{item_id}/export/markdown")
        self.assertEqual(md_res.status_code, 200)
        self.assertIn("Automated Test Strategy Document", md_res.text)

        # Toggle action item if action items exist
        if data.get("action_items"):
            action_id = data["action_items"][0]["id"]
            patch_res = self.client.patch(f"/api/v1/curated/{item_id}/action/{action_id}?completed=true")
            self.assertEqual(patch_res.status_code, 200)

        # Delete item
        del_res = self.client.delete(f"/api/v1/curated/{item_id}")
        self.assertEqual(del_res.status_code, 200)

    def test_google_handshake_sync(self):
        headers = {
            "x-goog-channel-id": "handshake-chan-01",
            "x-goog-resource-state": "sync"
        }
        res = self.client.post("/api/v1/webhook/google", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn("sync acknowledged", res.text)

    def test_rss_feed(self):
        res = self.client.get("/api/v1/feed.rss")
        self.assertEqual(res.status_code, 200)
        self.assertIn("<rss", res.text)
        self.assertIn("WorkspaceCurator Pro", res.text)


if __name__ == "__main__":
    unittest.main()
