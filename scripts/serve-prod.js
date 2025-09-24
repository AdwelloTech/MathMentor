const express = require('express');
const path = require('path');

const app = express();
const PORT = process.argv[2] || 3001;

// Serve static files from the production build directory
app.use(express.static(path.join(__dirname, '../dist-prod')));

// Handle SPA routing - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-prod/index.html'));
});

app.listen(PORT, () => {
  console.log(`Production frontend server running on http://localhost:${PORT}`);
});
