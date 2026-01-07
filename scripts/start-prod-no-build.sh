#!/bin/bash

# Change to the project root directory
cd "$(dirname "$0")/.."

echo "Starting MathMentor Production Environment (using pre-built frontend)..."
echo "Frontend: http://localhost:3001"
echo "Backend: http://localhost:5001"
echo ""

# Copy production environment files (skip if files don't exist)
cp .env.prod .env 2>/dev/null || echo "Warning: .env.prod not found, using existing .env"
cp backend/.env.prod backend/.env 2>/dev/null || echo "Warning: backend/.env.prod not found, using existing backend/.env"

# Check if production build exists
if [ ! -d "dist-prod" ]; then
  echo "Error: dist-prod directory not found. Please run the full production build first."
  echo "Use: ./scripts/start-prod.sh"
  exit 1
fi

echo "Using existing production build from dist-prod/"
echo ""

# Start production environment
npx concurrently -n web,api -c green,yellow "node scripts/serve-prod.js 3001" "npm run --prefix backend start"
