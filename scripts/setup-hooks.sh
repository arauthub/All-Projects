#!/usr/bin/env bash
# scripts/setup-hooks.sh
# Installs and activates version-controlled Git pre-commit and pre-push security hooks.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🔐 Configuring Monorepo Git Security Hooks..."
echo "=================================================="

# Ensure .githooks directory exists
mkdir -p "$REPO_ROOT/.githooks"
mkdir -p "$REPO_ROOT/.git/hooks"

# Make hooks and presubmit scripts executable
chmod +x "$REPO_ROOT/.githooks/pre-commit" 2>/dev/null || true
chmod +x "$REPO_ROOT/.githooks/pre-push" 2>/dev/null || true
chmod +x "$REPO_ROOT/.git/hooks/pre-commit" 2>/dev/null || true
chmod +x "$REPO_ROOT/.git/hooks/pre-push" 2>/dev/null || true
chmod +x "$REPO_ROOT/scripts/presubmit.sh" 2>/dev/null || true
chmod +x "$REPO_ROOT/scripts/presubmit.py" 2>/dev/null || true
chmod +x "$REPO_ROOT/scripts/purge-sensitive-history.sh" 2>/dev/null || true

# Point git core.hooksPath to version-controlled .githooks
git config core.hooksPath .githooks

echo "✅ Git core.hooksPath configured to: .githooks"
echo "✅ Active hooks:"
echo "   - Pre-Commit: Blocks sensitive leaks, unmasked .env files, private keys, and API tokens."
echo "   - Pre-Push:   Validates unpushed commits and verifies portfolio synchronization."
echo "=================================================="
echo "🎉 Git security hooks successfully activated!"
