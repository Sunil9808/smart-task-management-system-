import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mongoose from 'mongoose';
import { readEnv } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { createApp, finishApp } from './app.js';
import { User } from './models/User.js';
import { Task } from './models/Task.js';

try {
  const config = readEnv();
  await connectDatabase(config.mongoUri);
  await Promise.all([User.init(), Task.init()]);
  const app = createApp(config);
  if (config.production) {
    const dist = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
    app.use(express.static(dist));
    app.get('/{*path}', (req, res, next) =>
      req.path.startsWith('/api/') ? next() : res.sendFile(path.join(dist, 'index.html')),
    );
  }
  finishApp(app);
  const server = app.listen(config.port, () =>
    console.log(`API listening on http://127.0.0.1:${config.port}`),
  );
  const shutdown = () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  console.error(
    error.name === 'MongooseServerSelectionError'
      ? 'MongoDB unavailable. Check MONGODB_URI, network access, and Atlas IP allowlist.'
      : error.message,
  );
  process.exit(1);
}
