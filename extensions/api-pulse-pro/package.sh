#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DIST_DIR="$SCRIPT_DIR/dist"
ZIP_NAME="api-pulse-pro-v1.0.0.zip"

echo "📦 Packaging API Pulse Pro for Chrome Web Store & Edge Add-ons..."
mkdir -p "$DIST_DIR"
rm -f "$DIST_DIR/$ZIP_NAME"

zip -r "$DIST_DIR/$ZIP_NAME" \
  manifest.json \
  assets \
  background \
  content \
  popup \
  studio \
  devtools \
  test-page \
  README.md \
  PRIVACY_POLICY.md \
  -x "*.DS_Store" -x "*/.DS_Store"

echo "✅ Production package created at: $DIST_DIR/$ZIP_NAME"
ls -lh "$DIST_DIR/$ZIP_NAME"
