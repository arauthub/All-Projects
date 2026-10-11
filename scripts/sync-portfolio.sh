#!/usr/bin/env bash
# scripts/sync-portfolio.sh
# Shell wrapper to synchronize Nexus Prime Jamstack portfolio

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "⚡ [Nexus Prime] Running portfolio synchronization..."
python3 "$REPO_ROOT/scripts/sync_portfolio.py" "$@"

exit 0
