#!/bin/bash
# scripts/sync-cv.sh
# Ensures CV_Abhijeet_Raut.md and PROFILE.md are synchronized with all monorepo projects on git push.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🔍 [CV Sync Hook] Verifying CV and Profile synchronization with monorepo..."

CV_FILE="$REPO_ROOT/CV_Abhijeet_Raut.md"
PROFILE_FILE="$REPO_ROOT/PROFILE.md"
README_FILE="$REPO_ROOT/README.md"

# 1. Verify existence of CV and documentation
if [ ! -f "$CV_FILE" ] || [ ! -f "$PROFILE_FILE" ]; then
  echo "❌ Error: CV_Abhijeet_Raut.md or PROFILE.md not found in repository root!"
  exit 1
fi

# 2. Check that key projects are listed
REQUIRED_PROJECTS=("ARNAS" "MyAgents" "Link Inspector Pro" "Diagram & Image Lens Pro" "Anti-Gravity Web" "Flashapps" "Wagtailwind")
for proj in "${REQUIRED_PROJECTS[@]}"; do
  if ! grep -q "$proj" "$CV_FILE"; then
    echo "⚠️ Warning: Project '$proj' missing from CV_Abhijeet_Raut.md! Please verify."
  fi
  if ! grep -q "$proj" "$README_FILE"; then
    echo "⚠️ Warning: Project '$proj' missing from README.md! Please verify."
  fi
done

# 3. If CV or PROFILE has unstaged or staged uncommitted changes, commit them
if [ -n "$(git status --porcelain "$CV_FILE" "$PROFILE_FILE")" ]; then
  echo "📝 Staging updated CV and Profile files..."
  git add "$CV_FILE" "$PROFILE_FILE"
  if git commit -m "docs: sync CV and profile with latest project features [skip ci]" 2>/dev/null; then
    echo "✅ Committed updated CV and Profile."
  fi
fi

echo "✅ [CV Sync Hook] CV and Profile are verified and up to date."
exit 0
