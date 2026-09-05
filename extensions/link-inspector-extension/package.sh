#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DIST_DIR="$SCRIPT_DIR/dist"
ZIP_NAME="link-inspector-pro-v1.0.0.zip"

echo "📦 Packaging Link Inspector Pro for Chrome Web Store & Edge Add-ons..."
mkdir -p "$DIST_DIR"
rm -f "$DIST_DIR/$ZIP_NAME"

zip -r "$DIST_DIR/$ZIP_NAME" \
  manifest.json \
  assets/icon16.png \
  assets/icon48.png \
  assets/icon128.png \
  background/background.js \
  content/content.css \
  content/content.js \
  popup/popup.html \
  popup/popup.css \
  popup/popup.js \
  -x "*.DS_Store"

echo "✅ Production package created at: $DIST_DIR/$ZIP_NAME"
ls -lh "$DIST_DIR/$ZIP_NAME"
