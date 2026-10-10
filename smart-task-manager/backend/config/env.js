import 'dotenv/config';
export function readEnv(source = process.env) {
  const { MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN = 'http://127.0.0.1:5173' } = source;
  if (!MONGODB_URI || !/^mongodb(\+srv)?:\/\//.test(MONGODB_URI))
    throw new Error('Set MONGODB_URI in backend/.env to a MongoDB connection string.');
  if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.startsWith('replace-'))
    throw new Error('JWT_SECRET must be a random secret of at least 32 characters.');
  const origin = new URL(CLIENT_ORIGIN);
  if (origin.origin !== CLIENT_ORIGIN)
    throw new Error('CLIENT_ORIGIN must be an exact origin without a trailing slash.');
  const production = source.NODE_ENV === 'production';
  if (production && origin.protocol !== 'https:')
    throw new Error('Production CLIENT_ORIGIN requires HTTPS.');
  const port = Number(source.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
  return {
    mongoUri: MONGODB_URI,
    jwtSecret: JWT_SECRET,
    clientOrigin: CLIENT_ORIGIN,
    production,
    port,
    trustProxy: source.TRUST_PROXY === '1' ? 1 : false,
  };
}
