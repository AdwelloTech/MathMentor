#!/bin/bash

echo "Starting MathMentor Development Environment..."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo ""

# Copy development environment files
cp .env.dev .env
cp backend/.env.dev backend/.env

# Start development environment
npm run start:dev
