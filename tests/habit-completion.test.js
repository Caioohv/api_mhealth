const request = require('supertest');
const express = require('express');
const configure = require('../app/config/express');
const prisma = require('../app/config/prisma');

const app = express();
configure(app);

// ─── Helpers ────────────────────────────────────────────────────────────────

async function registerUser(suffix) {
  const res = await request(app)
    .post('/auth/register')
    .send({
      email: `habits-${suffix}@test.com`,
      password: 'password123',
      name: `User ${suffix}`,
    });
  expect(res.statusCode).toEqual(201);
  return { token: res.body.accessToken, userId: res.body.user.id };
}

async function createNetwork(token, suffix) {
  const res = await request(app)
    .post('/api/networks')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: `Habit Network ${suffix}` });
  expect(res.statusCode).toEqual(201);
  return res.body.id;
}

async function createHabit(token, networkId, data = {}) {
  const res = await request(app)
    .post(`/api/networks/${networkId}/habits`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Tomar água', frequency: 'DAILY', ...data });
  expect(res.statusCode).toEqual(201);
  return res.body.id;
}

/** Insert a HabitRecord directly via Prisma with a custom completedAt timestamp. */
async function insertRecord(habitId, userId, completedAt) {
  return prisma.habitRecord.create({
    data: { habitId, registeredBy: userId, completedAt },
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/networks/:networkId/habits — completedToday', () => {
  let token;
  let userId;
  let networkId;

  beforeEach(async () => {
    const user = await registerUser(`ct-${Date.now()}`);
    token = user.token;
    userId = user.userId;
    networkId = await createNetwork(token, `ct-${Date.now()}`);
  });

  // AC-1: habit without goal, completed today → completedToday: true
  it('returns completedToday: true for a habit without goal when a record was added today', async () => {
    const habitId = await createHabit(token, networkId, { name: 'Caminhar 10 min' });

    // Add a record via the API endpoint (completedAt = now by default)
    const recordRes = await request(app)
      .post(`/api/habits/${habitId}/records`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(recordRes.statusCode).toEqual(201);

    const res = await request(app)
      .get(`/api/networks/${networkId}/habits`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    const habit = res.body.find(h => h.id === habitId);
    expect(habit).toBeDefined();
    expect(habit.completedToday).toBe(true);
    // No goal → progress is still null
    expect(habit.progress).toBeNull();
  });

  // AC-3: record from yesterday → completedToday: false
  it('returns completedToday: false when the only record was created yesterday', async () => {
    const habitId = await createHabit(token, networkId, { name: 'Exercício matinal' });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await insertRecord(habitId, userId, yesterday);

    const res = await request(app)
      .get(`/api/networks/${networkId}/habits`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    const habit = res.body.find(h => h.id === habitId);
    expect(habit).toBeDefined();
    expect(habit.completedToday).toBe(false);
  });

  // AC-2: habit with goal, completed today → completedToday: true and progress reflects it
  it('returns completedToday: true and progress for a habit with goal completed today', async () => {
    const habitId = await createHabit(token, networkId, {
      name: 'Beber água',
      goal: 8,
      unit: 'copos',
    });

    const recordRes = await request(app)
      .post(`/api/habits/${habitId}/records`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(recordRes.statusCode).toEqual(201);

    const res = await request(app)
      .get(`/api/networks/${networkId}/habits`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    const habit = res.body.find(h => h.id === habitId);
    expect(habit).toBeDefined();
    expect(habit.completedToday).toBe(true);
    expect(habit.progress).not.toBeNull();
    expect(habit.progress.current).toBeGreaterThan(0);
  });

  // Baseline: habit with no records → completedToday: false
  it('returns completedToday: false for a habit that has never been completed', async () => {
    const habitId = await createHabit(token, networkId, { name: 'Meditar' });

    const res = await request(app)
      .get(`/api/networks/${networkId}/habits`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    const habit = res.body.find(h => h.id === habitId);
    expect(habit).toBeDefined();
    expect(habit.completedToday).toBe(false);
  });
});
