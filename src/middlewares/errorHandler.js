import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  console.error('🔥 Global Error Handler:', err);
    logger.error(`🔥 Global Error Handler: ${err.message}`, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    body: req.body,
  });


  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
