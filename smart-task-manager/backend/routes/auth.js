import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { register, login, me, logout } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';
export const authRouter = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Too many sign-in attempts. Try again in 15 minutes.' } },
});
authRouter.post('/register', limiter, register);
authRouter.post('/login', limiter, login);
authRouter.get('/me', authenticate, me);
authRouter.post('/logout', logout);
