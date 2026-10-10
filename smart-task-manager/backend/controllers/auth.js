import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
import { ApiError } from '../utils/errors.js';
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});
const cookieOptions = (config) => ({
  httpOnly: true,
  secure: config.production,
  sameSite: 'strict',
  path: '/',
});
function startSession(req, res, user) {
  const config = req.app.locals.config;
  const token = jwt.sign({}, config.jwtSecret, {
    subject: user.id,
    expiresIn: '8h',
    algorithm: 'HS256',
    issuer: 'smart-task-manager',
    audience: 'smart-task-manager-web',
  });
  res.cookie('session', token, { ...cookieOptions(config), maxAge: 8 * 60 * 60 * 1000 });
}
export async function register(req, res) {
  const { name, email, password } = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  startSession(req, res, user);
  res.status(201).json({ data: { user: publicUser(user) } });
}
const dummyHash = bcrypt.hashSync('constant-timing-password-not-an-account', 12);
export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email }).select('+passwordHash');
  const valid = await bcrypt.compare(password, user?.passwordHash || dummyHash);
  if (!user || !valid) throw new ApiError(401, 'Email or password is incorrect.');
  startSession(req, res, user);
  res.json({ data: { user: publicUser(user) } });
}
export function me(req, res) {
  res.json({ data: { user: publicUser(req.user) } });
}
export function logout(req, res) {
  res.clearCookie('session', cookieOptions(req.app.locals.config));
  res.status(204).end();
}
