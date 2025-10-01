#!/bin/bash

echo "Stopping all MathMentor environments..."

# Find and kill processes on the specific ports
echo "Stopping development environment (ports 3000, 5000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No process on port 3000"
lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "No process on port 5000"

echo "Stopping production environment (ports 3001, 5001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "No process on port 3001"
lsof -ti:5001 | xargs kill -9 2>/dev/null || echo "No process on port 5001"

echo "All environments stopped."
