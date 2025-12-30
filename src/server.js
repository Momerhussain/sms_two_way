import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import { config } from './config/index.js';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

// Start server
const server = app.listen(config.port, () => {
  console.log(`🚀 Server running in ${config.env} mode on port ${config.port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  server.close(() => process.exit(1));
});
