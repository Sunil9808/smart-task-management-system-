// Run against dev:local or npm run dev. Uses real HTTP through Vite's API proxy.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
const origin = 'http://127.0.0.1:5173';
let cookie = '',
  taskId;
async function call(path, method = 'GET', body) {
  const response = await fetch(`${origin}/api${path}`, {
    method,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const session = response.headers.getSetCookie()[0];
  if (session) cookie = session.split(';')[0];
  assert.ok(response.ok, `${method} ${path} returned ${response.status}`);
  return response.status === 204 ? null : (await response.json()).data;
}
try {
  const html = await fetch(origin);
  assert.equal(html.status, 200);
  assert.match(await html.text(), /src\/main.jsx/);
  assert.equal((await call('/health')).database, 'connected');
  await call('/auth/register', 'POST', {
    name: 'Local verification',
    email: `smoke-${randomBytes(6).toString('hex')}@example.invalid`,
    password: randomBytes(24).toString('hex'),
  });
  assert.equal((await call('/auth/me')).user.name, 'Local verification');
  const payload = {
    title: 'Verify live proxy persistence',
    description: 'Disposable integration check',
    dueDate: '2026-10-10',
    category: 'Projects',
    priority: 'High',
    status: 'To Do',
  };
  taskId = (await call('/tasks', 'POST', payload)).task._id;
  assert.equal((await call(`/tasks/${taskId}`)).task.title, payload.title);
  await call(`/tasks/${taskId}`, 'PUT', {
    ...payload,
    title: 'Live integration verified',
    priority: 'Low',
  });
  await call(`/tasks/${taskId}/status`, 'PATCH', { status: 'Completed' });
  assert.equal((await call('/dashboard/stats?today=2026-10-10')).completion, 100);
  assert.equal((await call('/tasks?search=verified&category=Projects')).pagination.total, 1);
  await call(`/tasks/${taskId}`, 'DELETE');
  taskId = null;
  assert.equal((await call('/tasks')).pagination.total, 0);
  await call('/auth/logout', 'POST');
  console.log(
    'PASS: frontend HTML, Vite proxy, MongoDB health, registration, session, persisted task CRUD, search, dashboard and logout.',
  );
  console.log(
    'A disposable, empty smoke-test account remains in this local database. No user data was modified.',
  );
} finally {
  if (taskId) await call(`/tasks/${taskId}`, 'DELETE').catch(() => {});
}
