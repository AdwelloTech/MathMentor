import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.argv[2] || 3001;

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  pathRewrite: (path, req) => `/api${path}` // Prepend /api to maintain full path
}));

// Serve static files from the production build directory
app.use(express.static(path.join(__dirname, '../dist-prod')));

// Handle SPA routing - send all non-API requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-prod/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production frontend server running on http://0.0.0.0:${PORT}`);
});
