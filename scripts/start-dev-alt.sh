#!/bin/bash

echo "Starting MathMentor Development Environment (Alternative Ports)..."
echo "Frontend: http://localhost:3002"
echo "Backend: http://localhost:5002"
echo ""

# Create alternative environment files
cat > .env << 'EOF'
# Frontend Environment Variables for Development (Alternative Ports)
VITE_API_URL=http://localhost:5002
VITE_NODE_ENV=development
EOF

cat > backend/.env << 'EOF'
# Server Configuration
PORT=5002
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3002

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mathmentor_dev

# JWT Configuration (temporary - will be updated)
JWT_SECRET=temp-jwt-secret-for-development
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=temp-refresh-secret-for-development
JWT_REFRESH_EXPIRE=7d

# OpenRouter API (placeholder)
OPENROUTER_API_KEY=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

# Logging
LOG_LEVEL=info

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
EOF

# Start development environment with alternative ports
npm run dev:alt
