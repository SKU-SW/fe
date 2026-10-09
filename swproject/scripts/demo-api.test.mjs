/** Verify fixture boundaries using a real local HTTP server, without external services. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { demoMiddleware } from './demo-api.mjs';

test('local demo handles login, empty state, unsupported writes and fallback', async t => {
  const server = createServer((req, res) => demoMiddleware(req, res, () => { res.writeHead(418); res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const login = await fetch(`${origin}/api/v1/auth/login/email`, { method: 'POST', body: '{}' });
  const session = await login.json();
  assert.equal(login.status, 200);
  assert.equal(session.email, 'demo@example.com');
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const characters = await fetch(`${origin}/api/v1/characters?page=1`, { headers });
  assert.deepEqual((await characters.json()).content, []);
  assert.equal((await fetch(`${origin}/api/v1/characters`)).status, 401);
  assert.equal((await fetch(`${origin}/api/v1/stream/info`, { headers })).status, 404);
  for (const path of ['stream/start', 'characters', 'auth/register/email']) {
    assert.equal((await fetch(`${origin}/api/v1/${path}`, { method: 'POST', headers })).status, 501);
  }
  assert.equal((await fetch(`${origin}/api/v1/unknown`, { headers })).status, 501);
  assert.equal((await fetch(`${origin}/icon.png`)).status, 418);
});
