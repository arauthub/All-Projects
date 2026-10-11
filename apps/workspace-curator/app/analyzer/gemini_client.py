"""Optional Google Gemini API integration for generative curation synthesis."""

import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from app.config import GEMINI_API_KEY, ENABLE_GEMINI_AI


class GeminiClient:
    def __init__(self, api_key: str = GEMINI_API_KEY):
        self.api_key = api_key
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

    @property
    def is_available(self) -> bool:
        return ENABLE_GEMINI_AI and bool(self.api_key)

    def analyze_content(self, title: str, product: str, content: str) -> Optional[Dict[str, Any]]:
        """Call Gemini to extract structured analysis in JSON."""
        if not self.is_available:
            return None

        prompt = f"""
You are an enterprise Google Workspace content curation analyst.
Analyze the following {product} update titled "{title}":

Content:
\"\"\"{content}\"\"\"

Return ONLY valid JSON matching this exact structure:
{{
  "summary": "Crisp 2-sentence executive summary",
  "key_takeaways": ["point 1", "point 2", "point 3"],
  "action_items": [
    {{"task": "Task description", "assignee": "Name or null", "deadline": "Date or null", "priority": "low|medium|high|critical"}}
  ],
  "sentiment": "positive|neutral|concerned|urgent",
  "urgency": "low|medium|high|critical",
  "urgency_score": 75,
  "tags": ["tag1", "tag2"],
  "metrics": ["$1.2M", "15% growth"]
}}
"""
        req_data = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "response_mime_type": "application/json"
            }
        }

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(req_data).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                result = json.loads(response.read().decode("utf-8"))
                text_out = result["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text_out)
        except Exception:
            # Fall back to local heuristic analyzer seamlessly
            return None


gemini_client = GeminiClient()
