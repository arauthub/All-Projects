#!/usr/bin/env bash
# Quick local HTTP server for API Pulse Pro test playground
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../test-page"

PORT=8080
echo "⚡ Starting API Pulse Pro Test Server at http://localhost:$PORT ..."
echo "👉 Open Chrome, load unpacked extension, and navigate to: http://localhost:$PORT"
python3 -m http.server "$PORT"
