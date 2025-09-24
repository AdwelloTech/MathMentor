#!/bin/bash

echo "MathMentor Environment Status"
echo "=============================="
echo ""

check_port() {
    local port=$1
    local service=$2
    if lsof -i :$port > /dev/null 2>&1; then
        echo "✅ $service running on port $port"
    else
        echo "❌ $service not running on port $port"
    fi
}

echo "Development Environment:"
check_port 3000 "Frontend (Dev)"
check_port 5000 "Backend (Dev)"
echo ""

echo "Production Environment:"
check_port 3001 "Frontend (Prod)"
check_port 5001 "Backend (Prod)"
echo ""

echo "Access URLs:"
echo "Development: http://localhost:3000"
echo "Production:  http://localhost:3001"
