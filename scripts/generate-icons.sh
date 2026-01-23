#!/bin/bash

# Generate PWA icons from source image
# Usage: ./scripts/generate-icons.sh path/to/source-image.png

set -e

SOURCE_IMAGE="${1:-public/rmr-logo.png}"

if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "❌ Source image not found: $SOURCE_IMAGE"
  echo "Usage: ./scripts/generate-icons.sh path/to/source-image.png"
  exit 1
fi

echo "🎨 Generating PWA icons from: $SOURCE_IMAGE"
echo ""

# Create icons directory if it doesn't exist
mkdir -p public/icons

# Array of icon sizes needed
SIZES=(16 32 72 96 128 144 152 192 384 512)

# Generate each size
for SIZE in "${SIZES[@]}"; do
  OUTPUT="public/icons/icon-${SIZE}x${SIZE}.png"
  echo "📐 Generating ${SIZE}x${SIZE}..."
  sips -z $SIZE $SIZE "$SOURCE_IMAGE" --out "$OUTPUT" > /dev/null 2>&1
done

# Generate favicon.ico (16x16 and 32x32)
echo "📐 Generating favicon.ico..."
sips -z 32 32 "$SOURCE_IMAGE" --out "public/favicon-32.png" > /dev/null 2>&1
sips -z 16 16 "$SOURCE_IMAGE" --out "public/favicon-16.png" > /dev/null 2>&1

# Note: Converting to .ico requires additional tools
# For now, we'll use the PNG files and update the HTML to use them

echo ""
echo "✅ Icon generation complete!"
echo ""
echo "Generated icons:"
for SIZE in "${SIZES[@]}"; do
  echo "  ✓ public/icons/icon-${SIZE}x${SIZE}.png"
done
echo ""
echo "📝 Next steps:"
echo "  1. Update favicon references in src/app/layout.tsx"
echo "  2. Clear browser cache and reload"
echo "  3. Test PWA installation"

