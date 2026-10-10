import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/errors.js';
export async function authenticate(req, _res, next) {
  const token = req.cookies.session;
  if (!token) throw new ApiError(401, 'Please sign in to continue.');
  let payload;
  try {
    payload = jwt.verify(token, req.app.locals.config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'smart-task-manager',
      audience: 'smart-task-manager-web',
    });
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Please sign in to continue.');
  req.user = user;
  next();
}
