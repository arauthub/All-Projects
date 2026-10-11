"""Outbound Webhook Forwarder for downstream notification systems (Slack, Discord, Zapier)."""

import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from app.config import OUTBOUND_WEBHOOK_URL, OUTBOUND_WEBHOOK_ENABLED
from app.models import CuratedItem


class WebhookForwarder:
    def __init__(self):
        self.default_url = OUTBOUND_WEBHOOK_URL
        self.enabled = OUTBOUND_WEBHOOK_ENABLED

    def forward(self, item: CuratedItem, target_url: Optional[str] = None) -> Dict[str, Any]:
        """Dispatch curated item to an external webhook endpoint."""
        url = target_url or self.default_url
        if not url:
            return {"status": "skipped", "message": "No outbound webhook URL configured"}

        payload = {
            "text": item.formats.get("slack", item.summary),
            "source": f"Google {item.product.value.title()}",
            "title": item.source_title,
            "urgency": item.urgency.value,
            "urgency_score": item.urgency_score,
            "curated_item_id": item.id,
            "summary": item.summary,
            "action_items_count": len(item.action_items),
            "tags": item.tags
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "WorkspaceCurator-Forwarder/1.0"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                status_code = response.getcode()
                return {"status": "success", "status_code": status_code, "url": url}
        except urllib.error.HTTPError as e:
            return {"status": "error", "status_code": e.code, "message": str(e)}
        except Exception as e:
            return {"status": "error", "message": str(e)}


forwarder = WebhookForwarder()
