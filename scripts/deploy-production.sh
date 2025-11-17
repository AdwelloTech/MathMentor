#!/bin/bash

set -e  # Exit on error

echo "🚀 MathMentor Production Deployment"
echo "=================================="
echo ""

# Step 1: Optimize images
echo "📸 Step 1/5: Optimizing images..."
npm run optimize-images
echo "✅ Images optimized"
echo ""

# Step 2: Update code to use WebP
echo "🔄 Step 2/5: Updating code to use WebP images..."
npm run update-to-webp
npm run update-css-to-webp 2>/dev/null || true
echo "✅ Code updated to WebP"
echo ""

# Step 3: Add lazy loading
echo "⚡ Step 3/5: Adding lazy loading..."
node scripts/add-lazy-loading.js
echo "✅ Lazy loading added"
echo ""

# Step 4: Build for production
echo "🏗️  Step 4/5: Building for production..."
echo "This may take a few minutes..."
npm run build:prod
echo "✅ Production build complete"
echo ""

# Step 5: Show build stats
echo "📊 Step 5/5: Build Statistics"
echo "----------------------------"
if [ -d "dist-prod" ]; then
  DIST_SIZE=$(du -sh dist-prod | cut -f1)
  JS_SIZE=$(find dist-prod/assets/js -type f -name "*.js" ! -name "*.gz" ! -name "*.br" -exec du -ch {} + 2>/dev/null | grep total | cut -f1 || echo "N/A")
  CSS_SIZE=$(find dist-prod/assets/css -type f -name "*.css" ! -name "*.gz" ! -name "*.br" -exec du -ch {} + 2>/dev/null | grep total | cut -f1 || echo "N/A")
  IMG_SIZE=$(find dist-prod/assets/images -type f 2>/dev/null -exec du -ch {} + | grep total | cut -f1 || echo "N/A")
  
  echo "Total build size: $DIST_SIZE"
  echo "JavaScript size: $JS_SIZE"
  echo "CSS size: $CSS_SIZE"
  echo "Images size: $IMG_SIZE"
  
  echo ""
  echo "📦 Compressed versions created:"
  GZIP_COUNT=$(find dist-prod -name "*.gz" 2>/dev/null | wc -l)
  BR_COUNT=$(find dist-prod -name "*.br" 2>/dev/null | wc -l)
  echo "  - Gzip files: $GZIP_COUNT"
  echo "  - Brotli files: $BR_COUNT"
fi

echo ""
echo "✅ Production build ready in dist-prod/"
echo ""
echo "📝 Next steps:"
echo "   1. Test locally: npm run preview -- --config vite.config.prod.ts"
echo "   2. Deploy dist-prod/ folder to your production server"
echo "   3. Ensure server is configured to serve compressed files (.br, .gz)"
echo "   4. Set up proper cache headers (see DEPLOYMENT_GUIDE.md)"
echo ""


