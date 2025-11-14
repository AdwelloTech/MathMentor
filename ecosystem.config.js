module.exports = {
  apps: [
    {
      name: 'mathmentor-backend',
      cwd: '/opt/mathmentor/backend',
      script: 'dist/index.js',
      instances: 2, // Use 2 instances for better performance
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      max_memory_restart: '500M',
      error_file: '/opt/mathmentor/backend/logs/pm2-error.log',
      out_file: '/opt/mathmentor/backend/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

