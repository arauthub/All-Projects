#!/usr/bin/env bash
# Packaging script for Diagram & Image Lens Pro
# Creates clean, production-ready zip archive for Chrome Web Store and Edge Add-ons

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

DIST_DIR="$SCRIPT_DIR/dist"
mkdir -p "$DIST_DIR"

ZIP_NAME="diagram-image-lens-v1.0.0.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

rm -f "$ZIP_PATH"

echo "📦 Packaging Diagram & Image Lens Pro v1.0.0..."

# Chrome Web Store requires production files to be at the root of the ZIP
zip -r "$ZIP_PATH" \
  manifest.json \
  assets \
  background \
  content \
  popup \
  -x "*.DS_Store" \
  -x "*__MACOSX*" \
  -x "*.git*"

echo "✅ Package created successfully:"
echo "   Path: $ZIP_PATH"
echo "   Size: $(ls -lh "$ZIP_PATH" | awk '{print $5}')"
