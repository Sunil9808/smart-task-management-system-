import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp, finishApp } from '../app.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { readEnv } from '../config/env.js';
import { localMongoOptions } from '../../scripts/mongo-options.mjs';
let mongo, app;
const origin = 'http://127.0.0.1:5173';
const account = { name: 'Asha Rao', email: 'asha@example.com', password: 'secure-password-123' };
const task = {
  title: 'Prepare assessment',
  description: 'Review API behavior',
  category: 'Internships',
  priority: 'High',
  status: 'To Do',
  dueDate: '2026-10-10',
};
const post = (agent, path, body) => agent.post(path).set('Origin', origin).send(body);
async function session(email = account.email) {
  const agent = request.agent(app);
  await post(agent, '/api/auth/register', { ...account, email }).expect(201);
  return agent;
}
beforeAll(async () => {
  mongo = await MongoMemoryServer.create({
    ...localMongoOptions(),
    instance: { launchTimeout: 60000 },
  });
  await mongoose.connect(mongo.getUri());
  await Promise.all([User.init(), Task.init()]);
  app = finishApp(
    createApp({
      jwtSecret: 'test-secret-with-more-than-thirty-two-characters',
      clientOrigin: origin,
      production: false,
    }),
  );
});
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Task.deleteMany({})]);
});
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
describe('authentication and security', () => {
  it('registers, hashes passwords, sets a protected cookie and returns the profile', async () => {
    const agent = request.agent(app);
    const response = await post(agent, '/api/auth/register', account).expect(201);
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Strict');
    expect(response.body.data.user.passwordHash).toBeUndefined();
    const user = await User.findOne().select('+passwordHash');
    expect(await bcrypt.compare(account.password, user.passwordHash)).toBe(true);
    expect((await agent.get('/api/auth/me').expect(200)).body.data.user.name).toBe(account.name);
  });
  it('rejects duplicate email case-insensitively', async () => {
    await session();
    await post(request(app), '/api/auth/register', {
      ...account,
      email: 'ASHA@example.com',
    }).expect(409);
  });
  it('logs in and clears the session on logout', async () => {
    await session();
    const agent = request.agent(app);
    await post(agent, '/api/auth/login', {
      email: account.email,
      password: account.password,
    }).expect(200);
    await agent.get('/api/auth/me').expect(200);
    await post(agent, '/api/auth/logout', {}).expect(204);
    await agent.get('/api/auth/me').expect(401);
  });
  it('rejects wrong credentials and unknown accounts with identical messages', async () => {
    await session();
    const a = await post(request(app), '/api/auth/login', {
      email: account.email,
      password: 'wrong',
    }).expect(401);
    const b = await post(request(app), '/api/auth/login', {
      email: 'nobody@example.com',
      password: 'wrong',
    }).expect(401);
    expect(a.body).toEqual(b.body);
  });
  it('rejects invalid registration fields and overly long bcrypt passwords', async () => {
    await post(request(app), '/api/auth/register', {
      ...account,
      name: 'A',
      password: 'short',
    }).expect(400);
    await post(request(app), '/api/auth/register', {
      ...account,
      password: '界'.repeat(25),
    }).expect(400);
  });
  it('protects APIs and rejects tampered cookies', async () => {
    await request(app).get('/api/tasks').expect(401);
    await request(app).get('/api/dashboard/stats').expect(401);
    await request(app).get('/api/tasks').set('Cookie', 'session=forged').expect(401);
  });
  it('blocks missing and hostile origins even during login', async () => {
    await request(app).post('/api/auth/login').send(account).expect(403);
    await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://attacker.example')
      .send(account)
      .expect(403);
  });
  it('requires a secure production configuration', () => {
    expect(() => readEnv({ MONGODB_URI: 'mongodb://localhost/test', JWT_SECRET: 'short' })).toThrow(
      'JWT_SECRET',
    );
    expect(() =>
      readEnv({
        MONGODB_URI: 'mongodb://localhost/test',
        JWT_SECRET: 'a'.repeat(40),
        NODE_ENV: 'production',
        CLIENT_ORIGIN: origin,
      }),
    ).toThrow('HTTPS');
  });
});
describe('owned task APIs', () => {
  it('creates, persists, lists, retrieves, edits, changes status and deletes a task', async () => {
    const agent = await session();
    const { body } = await post(agent, '/api/tasks', task).expect(201);
    const id = body.data.task._id;
    expect((await Task.findById(id)).title).toBe(task.title);
    expect((await agent.get('/api/tasks').expect(200)).body.data.pagination.total).toBe(1);
    expect((await agent.get(`/api/tasks/${id}`).expect(200)).body.data.task.category).toBe(
      'Internships',
    );
    const edited = await agent
      .put(`/api/tasks/${id}`)
      .set('Origin', origin)
      .send({ ...task, title: 'Review complete', priority: 'Low' })
      .expect(200);
    expect(edited.body.data.task.title).toBe('Review complete');
    expect(edited.body.data.task.priority).toBe('Low');
    await agent
      .patch(`/api/tasks/${id}/status`)
      .set('Origin', origin)
      .send({ status: 'Completed' })
      .expect(200);
    expect((await Task.findById(id)).status).toBe('Completed');
    await agent.delete(`/api/tasks/${id}`).set('Origin', origin).expect(204);
    await agent.get(`/api/tasks/${id}`).expect(404);
    expect(await Task.countDocuments()).toBe(0);
  });
  it('prevents reading, editing, changing or deleting another user’s task', async () => {
    const owner = await session(),
      other = await session('other@example.com');
    const id = (await post(owner, '/api/tasks', task)).body.data.task._id;
    expect((await other.get('/api/tasks')).body.data.tasks).toEqual([]);
    expect((await other.get('/api/dashboard/stats')).body.data.total).toBe(0);
    await other.get(`/api/tasks/${id}`).expect(404);
    await other.put(`/api/tasks/${id}`).set('Origin', origin).send(task).expect(404);
    await other
      .patch(`/api/tasks/${id}/status`)
      .set('Origin', origin)
      .send({ status: 'Completed' })
      .expect(404);
    await other.delete(`/api/tasks/${id}`).set('Origin', origin).expect(404);
    expect(await Task.countDocuments()).toBe(1);
  });
  it('rejects invalid data, impossible dates, injected ownership and malformed IDs', async () => {
    const agent = await session();
    for (const data of [
      { ...task, title: ' ' },
      { ...task, dueDate: '2026-02-30' },
      { ...task, status: 'Unknown' },
      { ...task, priority: 'Urgent' },
      { ...task, category: 'Fake' },
      { ...task, user: new mongoose.Types.ObjectId().toString() },
    ])
      await post(agent, '/api/tasks', data).expect(400);
    await agent.get('/api/tasks/not-an-id').expect(400);
    await agent.get('/api/tasks?limit=1000').expect(400);
    await agent.get('/api/tasks?status[$ne]=Completed').expect(400);
  });
  it('filters, searches literal text, sorts and paginates', async () => {
    const agent = await session();
    await post(agent, '/api/tasks', { ...task, title: 'Read [guide]', dueDate: '2026-10-12' });
    await post(agent, '/api/tasks', {
      ...task,
      title: 'Call team',
      category: 'Work',
      status: 'In Progress',
      dueDate: '2026-10-11',
    });
    const filtered = await agent
      .get('/api/tasks?category=Work&priority=High&status=In%20Progress')
      .expect(200);
    expect(filtered.body.data.tasks.map((t) => t.title)).toEqual(['Call team']);
    expect((await agent.get('/api/tasks?search=%5Bguide%5D')).body.data.pagination.total).toBe(1);
    const sorted = await agent.get('/api/tasks?sort=dueDate&limit=1&page=1');
    expect(sorted.body.data.tasks[0].title).toBe('Call team');
    expect(sorted.body.data.pagination.pages).toBe(2);
    expect(
      (await agent.get('/api/tasks?sort=dueDate&limit=1&page=2')).body.data.tasks[0].title,
    ).toBe('Read [guide]');
  });
  it('computes dashboard counts and calendar views from MongoDB', async () => {
    const agent = await session();
    for (const values of [
      { dueDate: '2026-10-09' },
      { dueDate: '2026-10-10', status: 'In Progress' },
      { dueDate: '2026-10-11' },
      { dueDate: '2026-10-09', status: 'Completed', category: 'Work' },
    ])
      await post(agent, '/api/tasks', { ...task, ...values }).expect(201);
    const stats = (await agent.get('/api/dashboard/stats?today=2026-10-10').expect(200)).body.data;
    expect(stats).toMatchObject({
      total: 4,
      pending: 2,
      inProgress: 1,
      completed: 1,
      overdue: 1,
      today: 1,
      completion: 25,
    });
    expect(stats.categories.find((c) => c.name === 'Work').count).toBe(1);
    expect(stats.priorities.find((p) => p.name === 'High').count).toBe(4);
    expect(stats.upcoming.map((t) => t.dueDate.slice(0, 10))).toEqual(['2026-10-10', '2026-10-11']);
    expect(
      (await agent.get('/api/tasks?view=today&today=2026-10-10')).body.data.pagination.total,
    ).toBe(1);
    expect(
      (await agent.get('/api/tasks?view=overdue&today=2026-10-10')).body.data.pagination.total,
    ).toBe(1);
    expect(
      (await agent.get('/api/tasks?view=upcoming&today=2026-10-10')).body.data.pagination.total,
    ).toBe(2);
    expect(
      (await agent.get('/api/tasks?view=upcoming&today=2026-10-10&status=Completed')).body.data
        .pagination.total,
    ).toBe(0);
  });
  it('reports health and empty dashboard statistics', async () => {
    const agent = await session();
    expect((await request(app).get('/api/health').expect(200)).body.data.database).toBe(
      'connected',
    );
    expect((await agent.get('/api/dashboard/stats')).body.data).toMatchObject({
      total: 0,
      completion: 0,
      upcoming: [],
    });
    await request(app).get('/api/missing').expect(404);
  });
});
