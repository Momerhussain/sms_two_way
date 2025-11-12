// utils/logger.js
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';


// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logToFile = 'true';

// Ensure logs folder exists
const logDir = path.join(__dirname, '../../logs');
if (logToFile && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}


const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

if (logToFile) {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/app.log'),
      maxsize: 5 * 1024 * 1024, // 5MB rotation
      maxFiles: 5,
      tailable: true,
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`
    )
  ),
  transports,
});

export default logger;
