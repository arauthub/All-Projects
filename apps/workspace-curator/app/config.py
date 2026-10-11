"""Configuration settings for WorkspaceCurator Pro."""

import os
from pathlib import Path

# Base Paths
APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

DATABASE_PATH = os.getenv("DATABASE_PATH", str(DATA_DIR / "workspace_curator.db"))

# Server Settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8090"))
DEBUG = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

# Security / Verification
WORKSPACE_WEBHOOK_SECRET = os.getenv("WORKSPACE_WEBHOOK_SECRET", "wk-secret-curator-token")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() in ("true", "1", "yes")

# AI Settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ENABLE_GEMINI_AI = bool(GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"))

# Outbound Forwarding (Slack / Discord / Custom Webhook)
OUTBOUND_WEBHOOK_URL = os.getenv("OUTBOUND_WEBHOOK_URL", "")
OUTBOUND_WEBHOOK_ENABLED = os.getenv("OUTBOUND_WEBHOOK_ENABLED", "false").lower() in ("true", "1", "yes")
