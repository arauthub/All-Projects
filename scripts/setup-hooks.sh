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
chmod +x "$REPO_ROOT/scripts/run-all-precommits.sh" 2>/dev/null || true
chmod +x "$REPO_ROOT/scripts/purge-sensitive-history.sh" 2>/dev/null || true
chmod +x "$REPO_ROOT/scripts/sync-portfolio.sh" 2>/dev/null || true
chmod +x "$REPO_ROOT/scripts/sync_portfolio.py" 2>/dev/null || true

# Point git core.hooksPath to version-controlled .githooks
git config core.hooksPath .githooks

echo "✅ Git core.hooksPath configured to: .githooks"
echo "✅ Active hooks:"
echo "   - Pre-Commit: Validates staged changes against secret leaks, project prerequisites, and code integrity."
echo "   - Pre-Push:   Runs ALL pre-commit checks before pushing any project to remote."
echo "=================================================="
echo "🎉 Git security hooks successfully activated!"
