import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/errors.js';
import { authRouter } from './routes/auth.js';
import { taskRouter } from './routes/tasks.js';
import { authenticate } from './middleware/auth.js';
import { dashboardStats } from './controllers/dashboard.js';

export function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy || false);
  app.locals.config = config;
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 1000,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: { message: 'Too many requests. Please try again later.' } },
    }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.get('origin') !== config.clientOrigin
    )
      return res.status(403).json({ error: { message: 'Request origin is not allowed.' } });
    next();
  });
  app.get('/api/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
      data: {
        status: connected ? 'ok' : 'unavailable',
        database: connected ? 'connected' : 'disconnected',
      },
    });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', taskRouter);
  app.get('/api/dashboard/stats', authenticate, dashboardStats);
  return app;
}
export function finishApp(app) {
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
