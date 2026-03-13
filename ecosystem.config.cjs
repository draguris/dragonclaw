// PM2 Ecosystem Configuration
// Start: pm2 start ecosystem.config.cjs
// Monitor: pm2 monit
// Logs: pm2 logs dragonclaw

module.exports = {
  apps: [
    {
      name: 'dragonclaw',
      script: 'src/index.js',
      cwd: '/opt/dragonclaw',
      node_args: '--experimental-vm-modules',
      instances: 1,            // single instance (stateful agent)
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000,     // 5s between restarts

      // Environment
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/dragonclaw/error.log',
      out_file: '/var/log/dragonclaw/out.log',
      merge_logs: true,
      log_type: 'json',

      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],
};
