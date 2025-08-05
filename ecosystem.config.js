module.exports = {
  apps: [
    {
      name: 'dsu-discord-bot',
      script: 'src/index.js',
      
      // ✅ DYNAMIC: Use current working directory (hapus hardcoded path)
      cwd: process.cwd(),
      
      // ✅ Explicitly load .env from current directory
      env_file: '.env',
      
      // Basic configuration
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 8080
      },
      
      // Logging configuration
      log_file: 'logs/combined.log',
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced settings
      node_args: '--max_old_space_size=1024',
      merge_logs: true,
      
      // Restart policy
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      
      // Health monitoring
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Cron restart (daily at 3 AM WIB)
      cron_restart: '0 3 * * *',
      
      // Additional PM2 settings
      exec_mode: 'fork',
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '*.log'
      ],
      
      // Instance variables
      instance_var: 'INSTANCE_ID'
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:opisboy29/discord-dsu-bot.git',
      path: '/var/www/dsu-discord-bot',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};