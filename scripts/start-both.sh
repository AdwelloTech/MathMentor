#!/bin/bash

echo "Starting Both MathMentor Environments..."
echo ""
echo "Development Environment:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:5000"
echo ""
echo "Production Environment:"
echo "  Frontend: http://localhost:3001"
echo "  Backend: http://localhost:5001"
echo ""

# Build production frontend first
echo "Building production frontend..."
npm run build:prod

# Start both environments
npm run start:both
