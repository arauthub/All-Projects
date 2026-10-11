#!/usr/bin/env bash
# scripts/purge-sensitive-history.sh
# Purges sensitive information and removes historical references completely from Git.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

python3 "$REPO_ROOT/scripts/purge_sensitive_history.py" "$@"
