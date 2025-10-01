#!/bin/bash

echo "Starting MathMentor Production Environment..."
echo "Frontend: http://localhost:3001"
echo "Backend: http://localhost:5001"
echo ""

# Copy production environment files
cp .env.prod .env
cp backend/.env.prod backend/.env

# Build the production frontend
npm run build:prod

# Start production environment
concurrently -n web,api -c green,yellow "node scripts/serve-prod.js 3001" "npm run --prefix backend start"
