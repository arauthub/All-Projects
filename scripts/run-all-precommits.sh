#!/usr/bin/env bash
# scripts/run-all-precommits.sh
# Manually runs all pre-commit and pre-push verification checks across all projects in the monorepo.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "================================================================================"
echo "🛡️  ALL-PROJECTS MONOREPO: RUNNING COMPLETE PRE-COMMIT VERIFICATION SUITE"
echo "================================================================================"
echo "Checks to execute:"
echo "  1. Sensitive Information & Secret Leak Detection (Private keys, tokens, .env)"
echo "  2. Project Prerequisites & Technical Design Documents (All 12 projects)"
echo "  3. Monorepo Syntax & File Integrity (JSON, Python, Shell)"
echo "  4. CV & Profile Project Synchronization (CV_Abhijeet_Raut.md, PROFILE.md)"
echo "  5. Root README Projects Catalog Consistency"
echo "================================================================================"
echo ""

python3 "$REPO_ROOT/scripts/presubmit.py" --mode=standalone --all "$@"

echo ""
echo "================================================================================"
echo "🎉 ALL PRE-COMMIT VERIFICATION CHECKS PASSED!"
echo "   All projects satisfy all technical prerequisites and security standards."
echo "   Ready to safely push to remote!"
echo "================================================================================"
