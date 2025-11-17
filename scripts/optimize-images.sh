#!/bin/bash

# Image Optimization Script for MathMentor
# Converts images to WebP format and optimizes existing images

set -e

echo "🚀 Starting image optimization for MathMentor..."

# Function to convert image to WebP
convert_to_webp() {
    local input="$1"
    local output="${input%.*}.webp"

    # Skip if WebP already exists and is newer
    if [ -f "$output" ] && [ "$output" -nt "$input" ]; then
        echo "⏭️  Skipping $input (WebP already exists and is up to date)"
        return
    fi

    echo "🔄 Converting $input to WebP..."
    cwebp -q 80 "$input" -o "$output" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✅ Converted: $output"
    else
        echo "❌ Failed to convert: $input"
    fi
}

# Function to optimize existing image
optimize_image() {
    local file="$1"
    local temp_file="${file}.tmp"

    echo "⚡ Optimizing $file..."

    # Use imagemagick to optimize
    convert "$file" \
        -strip \
        -interlace Plane \
        -gaussian-blur 0.05 \
        -quality 85% \
        "$temp_file"

    if [ -f "$temp_file" ]; then
        mv "$temp_file" "$file"
        echo "✅ Optimized: $file"
    else
        echo "❌ Failed to optimize: $file"
    fi
}

# Process static assets
echo "📁 Processing static assets..."
find /opt/mathmentor/src/assets -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r file; do
    # Convert to WebP
    convert_to_webp "$file"

    # Optimize original
    optimize_image "$file"
done

# Process uploaded images (be careful with this!)
echo "📁 Processing uploaded profile images..."
find /opt/mathmentor/backend/uploads/profile-images -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -mtime +1 | head -20 | while read -r file; do
    # Only convert, don't optimize existing uploads to avoid data loss
    convert_to_webp "$file"
done

echo "🎉 Image optimization complete!"
echo ""
echo "📊 Optimization Summary:"
echo "- Converted images to WebP format (smaller file sizes)"
echo "- Optimized static assets with compression"
echo "- Maintained original quality while reducing file sizes"
echo ""
echo "💡 Benefits for slow networks:"
echo "- 25-50% smaller file sizes with WebP"
echo "- Faster loading times"
echo "- Better user experience on mobile/poor connections"
