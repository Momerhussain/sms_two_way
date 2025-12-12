module.exports = {
  apps: [
    {
      name: 'sms-rapper',
      script: './src/server.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        LOG_TO_FILE: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        LOG_TO_FILE: 'true'
      },
      // error_file: './logs/err.log',
      // out_file: './logs/out.log',
      time: true
    },
    {
      name: 'sms-worker',
      script: './src/workers/smsWorker.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'development',
        LOG_TO_FILE: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_TO_FILE: 'true'
      },
      // error_file: './logs/worker-err.log',
      // out_file: './logs/worker-out.log',
      time: true
    }
  ]
};
