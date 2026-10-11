#!/usr/bin/env bash
# scripts/deploy-to-user-pages.sh
# Deploys Nexus Prime Jamstack frontend directly to https://github.com/arauthub/arauthub.github.io
# Result: Live at https://arauthub.github.io/ (Root Domain)

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_REPO="https://github.com/arauthub/arauthub.github.io.git"
FRONTEND_DIR="$REPO_ROOT/apps/jamstack-frontend"
TEMP_DIR="/tmp/arauthub_pages_deploy_$$"

echo "🌌 [Nexus Prime Deployer] Preparing deployment to https://arauthub.github.io/..."

# 1. Build Jamstack static assets
cd "$FRONTEND_DIR"
node scripts/build-jamstack.mjs

# 2. Check if remote repository exists
echo "🔍 Checking remote repository $TARGET_REPO..."
if ! git ls-remote "$TARGET_REPO" >/dev/null 2>&1; then
  echo ""
  echo "⚠️  Repository 'arauthub.github.io' does not exist on GitHub yet."
  echo "👉 Please create it in 5 seconds by opening this link:"
  echo "   https://github.com/new?name=arauthub.github.io&public=true"
  echo ""
  echo "After clicking 'Create repository', re-run this script:"
  echo "   ./scripts/deploy-to-user-pages.sh"
  exit 1
fi

# 3. Create clean deployment tree
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
cp -r "$FRONTEND_DIR"/* "$TEMP_DIR"/
cp "$FRONTEND_DIR/.nojekyll" "$TEMP_DIR"/ 2>/dev/null || touch "$TEMP_DIR/.nojekyll"

cd "$TEMP_DIR"
git init
git checkout -b main
git config user.name "Abhijeet Raut"
git config user.email "theabhijeetraut@gmail.com"
git add .
git commit -m "feat(portfolio): deploy Nexus Prime Jamstack to https://arauthub.github.io/"

# 4. Push to arauthub.github.io main branch
echo "🚀 Pushing to $TARGET_REPO (main branch)..."
git push -f "$TARGET_REPO" main

rm -rf "$TEMP_DIR"

echo ""
echo "🎉 SUCCESS! Nexus Prime is deployed to https://arauthub.github.io/"
echo "🌐 Your portfolio is now live at: https://arauthub.github.io/"
