const request = require('supertest');
const express = require('express');
const configure = require('../app/config/express');

const app = express();
configure(app);

async function register(user) {
  const res = await request(app).post('/auth/register').send(user);
  return res.body.accessToken;
}

describe('Catch-all 404 handler', () => {
  const testUser = {
    email: 'notfound-test@example.com',
    password: 'password123',
    name: 'Not Found Tester',
  };

  it('returns a JSON 404 body (not an HTML page) for an unmatched authenticated /api route', async () => {
    const token = await register(testUser);

    const res = await request(app)
      .get('/api/this-route-does-not-exist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toHaveProperty('status', 'error');
    expect(typeof res.body.message).toBe('string');
  });

  it('never falls back to an unauthenticated 401 leaking an HTML body for unmatched /api routes', async () => {
    // Without a token, authMiddleware rejects before route matching even happens —
    // this still must be a JSON body, never Express's default HTML error page.
    const res = await request(app).get('/api/this-route-does-not-exist');

    expect(res.headers['content-type']).toMatch(/json/);
  });
});
