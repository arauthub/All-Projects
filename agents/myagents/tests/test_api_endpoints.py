"""
tests/test_api_endpoints.py
Integration tests for FastAPI endpoints: Scraper, Audit, and Formats.
"""

import unittest
from starlette.testclient import TestClient
from app.main import app

class TestScraperAPIEndpoints(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_get_formats_endpoint(self):
        resp = self.client.get("/api/scraper/formats")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("formats", data)
        self.assertIn("security_features", data)
        format_ids = [f["id"] for f in data["formats"]]
        self.assertIn("json", format_ids)
        self.assertIn("markdown", format_ids)
        self.assertIn("summary", format_ids)

    def test_ssrf_audit_endpoint_blocks_loopback(self):
        resp = self.client.post("/api/scraper/audit", json={"url": "http://127.0.0.1:8080/internal"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertFalse(data["safe"])
        self.assertTrue(any("loopback" in r.lower() for r in data["reasons"]))

    def test_ssrf_audit_endpoint_blocks_metadata(self):
        resp = self.client.post("/api/scraper/audit", json={"url": "http://169.254.169.254/computeMetadata/v1/"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertFalse(data["safe"])

    def test_scrape_endpoint_blocks_private_url(self):
        resp = self.client.post("/api/scraper/scrape", json={"url": "http://10.0.0.1/admin", "output_format": "json"})
        self.assertEqual(resp.status_code, 400)
        data = resp.json()
        self.assertFalse(data["success"])
        self.assertIn("SSRF Security Violation", data["error"])

if __name__ == "__main__":
    unittest.main()
