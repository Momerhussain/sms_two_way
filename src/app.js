import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { userRouter } from './routes/user.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { userRouter2 } from './routes/incoming.route.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/users', userRouter);
app.use('/api/incoming', userRouter2);

// Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Server is running 🚀' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
