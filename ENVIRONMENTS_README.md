# MathMentor Environment Setup

This setup allows you to run both development and production environments of MathMentor simultaneously on your VPS.

## Environment Configuration

### Development Environment
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Database**: MongoDB `mathmentor_dev`
- **Config**: Uses `vite.config.dev.ts` and `backend/.env.dev`

### Production Environment
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:5001
- **Database**: MongoDB `mathmentor_prod`
- **Config**: Uses `vite.config.prod.ts` and `backend/.env.prod`

## Quick Start

### Start Both Environments
```bash
./scripts/start-both.sh
```

### Start Individual Environments
```bash
# Development only
./scripts/start-dev.sh

# Production only
./scripts/start-prod.sh
```

### Check Status
```bash
./scripts/status.sh
```

### Stop All Environments
```bash
./scripts/stop-all.sh
```

## Manual Commands

### Development
```bash
# Frontend
npm run build:dev
npm run start:dev

# Backend
cd backend && npm run dev
```

### Production
```bash
# Build and serve frontend
npm run build:prod
node scripts/serve-prod.js 3001

# Backend
cd backend && npm run start
```

## Database Setup

Make sure MongoDB is running and create the databases:
```bash
mongo
> use mathmentor_dev
> use mathmentor_prod
```

## Environment Variables

### Frontend (.env.dev / .env.prod)
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `OPENROUTER_API_KEY`: OpenRouter API key

### Backend (backend/.env.dev / backend/.env.prod)
- `PORT`: Server port (5000 for dev, 5001 for prod)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: CORS allowed frontend URL
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `OPENROUTER_API_KEY`: OpenRouter API key

## Accessing the Applications

Once running, you can access:
- **Development**: http://your-vps-ip:3000
- **Production**: http://your-vps-ip:3001

## File Structure

```
mathmentor/
├── scripts/
│   ├── start-dev.sh      # Start development environment
│   ├── start-prod.sh     # Start production environment
│   ├── start-both.sh     # Start both environments
│   ├── stop-all.sh       # Stop all environments
│   ├── status.sh         # Check environment status
│   └── serve-prod.js     # Production static file server
├── .env.dev              # Development frontend config
├── .env.prod             # Production frontend config
├── vite.config.dev.ts    # Development Vite config
├── vite.config.prod.ts   # Production Vite config
└── backend/
    ├── .env.dev          # Development backend config
    └── .env.prod         # Production backend config
```

## Troubleshooting

1. **Port conflicts**: Make sure ports 3000, 3001, 5000, 5001 are available
2. **MongoDB connection**: Ensure MongoDB is running and accessible
3. **Build failures**: Run `npm install` in both root and backend directories
4. **Environment variables**: Check that all required env vars are set

## Security Notes

- Update JWT secrets in production
- Configure proper CORS settings for your domain when available
- Set up proper firewall rules for the ports
- Consider using PM2 or similar for production process management
