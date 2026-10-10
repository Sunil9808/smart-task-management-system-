// Optional local development with a real MongoDB binary, independent of Atlas.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { localMongoOptions } from './mongo-options.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const dbPath = fileURLToPath(new URL('../artifacts/local-mongodb/', import.meta.url));
await mkdir(dbPath, { recursive: true });
const mongo = await MongoMemoryServer.create({
  ...localMongoOptions(),
  instance: { dbPath, storageEngine: 'wiredTiger', dbName: 'taskly-local', launchTimeout: 60000 },
});
const backend = spawn(process.execPath, ['server.js'], {
  cwd: `${root}/backend`,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    MONGODB_URI: mongo.getUri('taskly-local'),
    JWT_SECRET: process.env.JWT_SECRET || randomBytes(48).toString('hex'),
    CLIENT_ORIGIN: 'http://127.0.0.1:5173',
    PORT: '5000',
  },
});
const frontend = spawn(
  process.execPath,
  [`${root}/node_modules/vite/bin/vite.js`, '--host', '127.0.0.1'],
  { cwd: `${root}/frontend`, stdio: 'inherit' },
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  backend.kill();
  frontend.kill();
  await mongo.stop({ doCleanup: false });
}
process.on('SIGINT', () => stop().then(() => process.exit(0)));
process.on('SIGTERM', () => stop().then(() => process.exit(0)));
for (const child of [backend, frontend])
  child.on('exit', (code) => {
    if (!stopping) stop().then(() => process.exit(code || 0));
  });
