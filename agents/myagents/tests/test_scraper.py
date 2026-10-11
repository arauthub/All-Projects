"""
tests/test_scraper.py
Comprehensive unit tests for WebScraperEngine, ScraperAgent,
and MultiAgentOrchestrator web scraping pipeline.
"""

import unittest
from core.scraper_engine import WebScraperEngine
from core.tools import ToolRegistry
from core.orchestrator import MultiAgentOrchestrator
from agents_pool.scraper_agent import ScraperAgent

SAMPLE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <title>Enterprise Cloud AI Platform</title>
  <meta name="description" content="Next-generation multi-agent orchestration and cloud platform.">
  <meta name="author" content="Abhijeet Raut">
  <meta property="og:title" content="Enterprise Cloud AI Platform - OG">
  <meta property="og:description" content="OpenGraph Description for AI Platform.">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Google ADK Orchestrator",
    "operatingSystem": "Cloud"
  }
  </script>
  <style>.hidden { display: none; }</style>
  <script>alert("malicious script should be stripped");</script>
</head>
<body>
  <nav><a href="/home">Home</a></nav>
  <main>
    <h1>Welcome to Cloud AI</h1>
    <p>This is the primary overview paragraph detailing scalable microservice architectures with high availability.</p>
    
    <h2>Key Pricing Tiers</h2>
    <p>Contact our sales team at sales@enterprise-ai.com or support@enterprise-ai.com for custom tier enterprise deployments starting at $499/month.</p>
    
    <table>
      <thead>
        <tr><th>Tier</th><th>QPS</th><th>Price</th></tr>
      </thead>
      <tbody>
        <tr><td>Starter</td><td>100</td><td>$49/mo</td></tr>
        <tr><td>Enterprise</td><td>10,000</td><td>$499/mo</td></tr>
      </tbody>
    </table>

    <h3>External Resources</h3>
    <a href="https://cloud.google.com/run">Google Cloud Run Documentation</a>
    <a href="https://github.com/arauthub/All-Projects">GitHub Monorepo</a>
  </main>
  <aside class="advertisement">Sponsored Ad Content to be removed</aside>
  <footer>Copyright 2026 Enterprise Inc.</footer>
</body>
</html>
"""

class TestWebScraperEngine(unittest.TestCase):

    def setUp(self):
        self.parsed = WebScraperEngine.parse_page(SAMPLE_HTML, base_url="https://enterprise-ai.com")

    def test_metadata_extraction(self):
        meta = self.parsed["metadata"]
        self.assertEqual(meta["title"], "Enterprise Cloud AI Platform")
        self.assertIn("Next-generation multi-agent", meta["description"])
        self.assertEqual(meta["author"], "Abhijeet Raut")
        self.assertEqual(meta["language"], "en")
        self.assertEqual(meta["open_graph"]["title"], "Enterprise Cloud AI Platform - OG")

    def test_json_ld_extraction(self):
        json_ld = self.parsed["json_ld"]
        self.assertEqual(len(json_ld), 1)
        self.assertEqual(json_ld[0]["name"], "Google ADK Orchestrator")

    def test_strip_scripts_and_boilerplates(self):
        text = self.parsed["full_clean_text"]
        self.assertNotIn("malicious script", text)
        self.assertNotIn("Sponsored Ad Content", text)
        self.assertNotIn("Copyright 2026", text)
        self.assertIn("scalable microservice architectures", text)

    def test_table_extraction(self):
        tables = self.parsed["tables"]
        self.assertEqual(len(tables), 1)
        self.assertEqual(tables[0]["headers"], ["Tier", "QPS", "Price"])
        self.assertEqual(len(tables[0]["rows"]), 2)
        self.assertEqual(tables[0]["rows"][0], ["Starter", "100", "$49/mo"])

    def test_markdown_format(self):
        md = WebScraperEngine.to_markdown(self.parsed)
        self.assertIn("# Enterprise Cloud AI Platform", md)
        self.assertIn("| Tier | QPS | Price |", md)
        self.assertIn("| Starter | 100 | $49/mo |", md)
        self.assertIn("[Google Cloud Run Documentation](https://cloud.google.com/run)", md)

    def test_key_value_extraction(self):
        kv = WebScraperEngine.to_key_value(self.parsed)
        self.assertIn("sales@enterprise-ai.com", kv["detected_emails"])
        self.assertTrue(any("$499" in p for p in kv["pricing_mentions"]))

    def test_custom_schema_extraction(self):
        schema = {
            "platform_title": "string",
            "contact_emails": "list",
            "pricing": "list",
        }
        res = WebScraperEngine.extract_custom_schema(self.parsed, schema)
        self.assertEqual(res["platform_title"], "Enterprise Cloud AI Platform")
        self.assertIn("sales@enterprise-ai.com", res["contact_emails"])

class TestScraperIntegration(unittest.TestCase):

    def setUp(self):
        self.orchestrator = MultiAgentOrchestrator()

    def test_scraper_agent_registered(self):
        self.assertIn("scraper", self.orchestrator.agents)
        agent = self.orchestrator.agents["scraper"]
        self.assertEqual(agent.name, "CyberScrape Sentinel")
        self.assertEqual(agent.agent_id, "scraper")

    def test_tools_registered(self):
        schemas = {t["name"]: t for t in self.orchestrator.tool_registry.get_tool_schemas()}
        self.assertIn("web_scraper_extract", schemas)
        self.assertIn("url_security_audit", schemas)
        self.assertIn("html_table_extractor", schemas)

    def test_security_audit_tool_execution(self):
        res = self.orchestrator.tool_registry.execute("url_security_audit", {"url": "http://127.0.0.1:8080"})
        self.assertTrue(res["success"])
        audit = res["result"]
        self.assertFalse(audit["safe"])

    def test_web_scraping_mission_execution(self):
        # Create web scraping mission
        mission = self.orchestrator.create_mission(
            objective="Scrape public website https://en.wikipedia.org/wiki/Artificial_intelligence and extract in markdown format."
        )
        events = list(self.orchestrator.execute_mission(mission.mission_id))
        
        # Verify event stream
        event_types = [e["type"] for e in events]
        self.assertIn("mission_started", event_types)
        self.assertIn("agent_activated", event_types)
        self.assertIn("mission_completed", event_types)

        # Verify scraper agent was activated
        activated_agents = [e.get("agent_id") for e in events if e["type"] == "agent_activated"]
        self.assertIn("scraper", activated_agents)
        self.assertEqual(mission.status, "completed")

if __name__ == "__main__":
    unittest.main()
