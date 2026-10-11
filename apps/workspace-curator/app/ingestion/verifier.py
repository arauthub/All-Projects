"""Google Workspace Push Notification and Webhook Verification."""

from typing import Dict, Optional, Tuple
from app.config import WORKSPACE_WEBHOOK_SECRET, REQUIRE_AUTH


class WebhookVerifier:
    @staticmethod
    def verify_headers(headers: Dict[str, str]) -> Tuple[bool, Optional[str]]:
        """
        Verify incoming Google Workspace Push Notification headers.
        Google Drive/Calendar sends:
          - X-Goog-Channel-ID
          - X-Goog-Channel-Token (matches our registration secret)
          - X-Goog-Resource-State (sync, add, update, trash)
        """
        # Lowercase all headers for case-insensitive lookup
        h = {k.lower(): v for k, v in headers.items()}

        # 1. Check for initial Google Drive/Calendar handshake
        resource_state = h.get("x-goog-resource-state")
        if resource_state == "sync":
            return True, "Handshake sync acknowledged"

        # 2. Check token if auth is required
        channel_token = h.get("x-goog-channel-token")
        auth_header = h.get("authorization", "")

        if REQUIRE_AUTH:
            if channel_token and channel_token == WORKSPACE_WEBHOOK_SECRET:
                return True, None
            if auth_header and WORKSPACE_WEBHOOK_SECRET in auth_header:
                return True, None
            return False, "Unauthorized: Invalid or missing token"

        return True, None
