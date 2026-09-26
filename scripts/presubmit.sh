#!/bin/bash
# scripts/presubmit.sh
# Presubmit suite wrapper: Sensitive information verification & automatic CV synchronization

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

python3 "$REPO_ROOT/scripts/presubmit.py" "$@"
