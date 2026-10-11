"""Unit tests for WorkspaceCurator Ingestion Layer."""

import unittest
import base64
import json
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models import WorkspaceProduct
from app.ingestion.verifier import WebhookVerifier
from app.ingestion.parser import WorkspacePayloadParser


class TestWebhookIngestion(unittest.TestCase):
    def test_handshake_verification(self):
        headers = {
            "X-Goog-Channel-ID": "test-channel-99",
            "X-Goog-Resource-State": "sync"
        }
        valid, reason = WebhookVerifier.verify_headers(headers)
        self.assertTrue(valid)
        self.assertIn("sync", reason.lower())

    def test_drive_push_parser(self):
        headers = {
            "X-Goog-Channel-ID": "chan-drive-001",
            "X-Goog-Resource-URI": "https://www.googleapis.com/drive/v3/files/file-123",
            "X-Goog-Resource-State": "update",
            "X-Goog-Message-Number": "42"
        }
        body = {"title": "Engineering Specs", "content": "Updated caching architecture."}
        product, title, sender, content, url, meta = WorkspacePayloadParser.parse(headers, body)

        self.assertEqual(product, WorkspaceProduct.DRIVE)
        self.assertEqual(title, "Engineering Specs")
        self.assertIn("Updated caching", content)
        self.assertEqual(meta["google_channel_id"], "chan-drive-001")

    def test_gmail_pubsub_parser(self):
        inner_data = json.dumps({"emailAddress": "cto@company.com", "historyId": "98765"})
        b64_data = base64.b64encode(inner_data.encode("utf-8")).decode("utf-8")
        body = {
            "message": {
                "data": b64_data,
                "messageId": "msg-12345"
            },
            "subscription": "projects/cloud/subscriptions/sub-gmail"
        }
        headers = {"content-type": "application/json"}
        product, title, sender, content, url, meta = WorkspacePayloadParser.parse(headers, body)

        self.assertEqual(product, WorkspaceProduct.GMAIL)
        self.assertEqual(sender, "cto@company.com")
        self.assertIn("98765", title)
        self.assertIn("cto@company.com", content)

    def test_forms_parser(self):
        body = {
            "product": "forms",
            "formTitle": "Customer NPS Survey 2026",
            "respondentEmail": "vip@client.com",
            "responses": {
                "Satisfaction": "10/10",
                "Feedback": "Outstanding speed and curation."
            }
        }
        headers = {"content-type": "application/json"}
        product, title, sender, content, url, meta = WorkspacePayloadParser.parse(headers, body)

        self.assertEqual(product, WorkspaceProduct.FORMS)
        self.assertEqual(title, "Customer NPS Survey 2026")
        self.assertEqual(sender, "vip@client.com")
        self.assertIn("10/10", content)

    def test_calendar_parser(self):
        body = {
            "product": "calendar",
            "summary": "Q4 Strategy Board Session",
            "organizer": {"email": "exec@company.com"},
            "start": {"dateTime": "2026-10-15T09:00:00Z"},
            "end": {"dateTime": "2026-10-15T12:00:00Z"},
            "attendees": [{"email": "ceo@company.com"}, {"email": "cfo@company.com"}],
            "description": "Discussing budget and global expansion."
        }
        headers = {"content-type": "application/json"}
        product, title, sender, content, url, meta = WorkspacePayloadParser.parse(headers, body)

        self.assertEqual(product, WorkspaceProduct.CALENDAR)
        self.assertEqual(title, "Q4 Strategy Board Session")
        self.assertEqual(sender, "exec@company.com")
        self.assertIn("ceo@company.com", content)


if __name__ == "__main__":
    unittest.main()
