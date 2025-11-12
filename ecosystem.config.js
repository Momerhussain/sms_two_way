export default {
  apps: [
    {
      name: 'sms-rapper',
      script: './src/server.js', // Entry file
      instances: 'max',          // Run across all CPU cores
      exec_mode: 'cluster',      // Enables clustering
      watch: false,              // Set true for auto-reload in dev
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log', // Log file for errors
      out_file: './logs/out.log',   // Log file for normal output
      time: true                    // Add timestamps to logs
    }
  ]
};
