require('./helpers/setup')

const request = require('supertest')
const express = require('express')
const configure = require('../app/config/express')

const app = express()
configure(app)

const RESPONSAVEL = {
  email: 'responsavel@example.com',
  password: 'senha123',
  name: 'Responsável',
  phone: '11900000001',
}

async function register(user) {
  const res = await request(app).post('/auth/register').send(user)
  return { token: res.body.accessToken, id: res.body.user.id }
}

async function createNetwork(token, data = { name: 'Rede Teste' }) {
  const res = await request(app)
    .post('/api/networks')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
  return res.body
}

async function createHabit(token, networkId, data = {}) {
  return request(app)
    .post(`/api/networks/${networkId}/habits`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Caminhada diária',
      frequency: 'DAILY',
      ...data,
    })
}

async function addRecord(token, habitId, data = {}) {
  return request(app)
    .post(`/api/habits/${habitId}/records`)
    .set('Authorization', `Bearer ${token}`)
    .send(data)
}

describe('Habits', () => {
  let responsavelToken
  let networkId

  beforeEach(async () => {
    ;({ token: responsavelToken } = await register(RESPONSAVEL))
    const network = await createNetwork(responsavelToken)
    networkId = network.id
  })

  // ─── Goal-less DAILY habit ──────────────────────────────────────────────

  describe('DAILY habit without a goal', () => {
    it('should report progress: null before any record exists, with current 0', async () => {
      const created = await createHabit(responsavelToken, networkId, { name: 'Tomar sol' })
      const habitId = created.body.id

      const res = await request(app)
        .get(`/api/networks/${networkId}/habits`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(res.statusCode).toBe(200)
      const habit = res.body.find((h) => h.id === habitId)
      expect(habit.progress).not.toBeNull()
      expect(habit.progress.current).toBe(0)
      expect(habit.progress.goal).toBeNull()
      expect(habit.progress.percentage).toBeNull()
    })

    it('should reflect current: 1 after a record is added, and persist on reload', async () => {
      const created = await createHabit(responsavelToken, networkId, { name: 'Caminhada diária' })
      const habitId = created.body.id

      const recordRes = await addRecord(responsavelToken, habitId)
      expect(recordRes.statusCode).toBe(201)

      const res = await request(app)
        .get(`/api/networks/${networkId}/habits`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      const habit = res.body.find((h) => h.id === habitId)
      expect(habit.progress.current).toBe(1)
      expect(habit.progress.goal).toBeNull()
      expect(habit.progress.percentage).toBeNull()

      // Fetching the habit detail should reflect the same completed state
      const detailRes = await request(app)
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(detailRes.statusCode).toBe(200)
      expect(detailRes.body.progress.current).toBe(1)
    })
  })

  // ─── Habit with a goal (existing behavior unchanged) ───────────────────

  describe('DAILY habit with a goal', () => {
    it('should compute current/goal/percentage as records are added', async () => {
      const created = await createHabit(responsavelToken, networkId, {
        name: 'Beber água',
        goal: 3,
        unit: 'copos',
      })
      const habitId = created.body.id

      await addRecord(responsavelToken, habitId)

      let res = await request(app)
        .get(`/api/networks/${networkId}/habits`)
        .set('Authorization', `Bearer ${responsavelToken}`)
      let habit = res.body.find((h) => h.id === habitId)
      expect(habit.progress.current).toBe(1)
      expect(habit.progress.goal).toBe(3)
      expect(habit.progress.percentage).toBe(33)

      await addRecord(responsavelToken, habitId)
      await addRecord(responsavelToken, habitId)

      res = await request(app)
        .get(`/api/networks/${networkId}/habits`)
        .set('Authorization', `Bearer ${responsavelToken}`)
      habit = res.body.find((h) => h.id === habitId)
      expect(habit.progress.current).toBe(3)
      expect(habit.progress.goal).toBe(3)
      expect(habit.progress.percentage).toBe(100)
    })

    it('should cap percentage at 100 when current exceeds goal', async () => {
      const created = await createHabit(responsavelToken, networkId, {
        name: 'Beber água',
        goal: 2,
        unit: 'copos',
      })
      const habitId = created.body.id

      await addRecord(responsavelToken, habitId)
      await addRecord(responsavelToken, habitId)
      await addRecord(responsavelToken, habitId)

      const res = await request(app)
        .get(`/api/networks/${networkId}/habits`)
        .set('Authorization', `Bearer ${responsavelToken}`)
      const habit = res.body.find((h) => h.id === habitId)
      expect(habit.progress.current).toBe(3)
      expect(habit.progress.percentage).toBe(100)
    })
  })

  // ─── DAILY habit day boundary (America/Sao_Paulo, not server TZ) ───────

  describe('DAILY habit day boundary anchored to America/Sao_Paulo', () => {
    const ALL_TIMERS_EXCEPT_DATE = [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ]

    afterEach(() => {
      jest.useRealTimers()
    })

    it('still counts a record from earlier the same BRT day even after the UTC calendar date has rolled over', async () => {
      const created = await createHabit(responsavelToken, networkId, { name: 'Caminhada diária' })
      const habitId = created.body.id

      // 08:00 BRT == 11:00 UTC, same calendar day in both zones.
      jest.useFakeTimers({ doNotFake: ALL_TIMERS_EXCEPT_DATE })
      jest.setSystemTime(new Date('2024-06-10T11:00:00.000Z'))

      const recordRes = await addRecord(responsavelToken, habitId)
      expect(recordRes.statusCode).toBe(201)

      // 22:00 BRT the *same* BRT day == 01:00 UTC the *next* UTC day.
      jest.setSystemTime(new Date('2024-06-11T01:00:00.000Z'))

      const res = await request(app)
        .get(`/api/networks/${networkId}/habits`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      const habit = res.body.find((h) => h.id === habitId)
      expect(habit.progress.current).toBe(1)
    })

    it('excludes a record from the BRT previous day even when it falls on the same UTC calendar day as "now"', async () => {
      const created = await createHabit(responsavelToken, networkId, { name: 'Caminhada diária' })
      const habitId = created.body.id

      // 23:59:59 BRT on 2024-06-09 == 02:59:59 UTC on 2024-06-10.
      jest.useFakeTimers({ doNotFake: ALL_TIMERS_EXCEPT_DATE })
      jest.setSystemTime(new Date('2024-06-10T02:59:59.000Z'))

      const recordRes = await addRecord(responsavelToken, habitId)
      expect(recordRes.statusCode).toBe(201)

      // 08:00 BRT on 2024-06-10 == 11:00 UTC on 2024-06-10 (same UTC calendar
      // day as the record above, but a different BRT calendar day).
      jest.setSystemTime(new Date('2024-06-10T11:00:00.000Z'))

      const res = await request(app)
        .get(`/api/networks/${networkId}/habits`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      const habit = res.body.find((h) => h.id === habitId)
      expect(habit.progress.current).toBe(0)
    })
  })

  // ─── CUSTOM frequency (unchanged: no progress) ──────────────────────────

  describe('CUSTOM frequency habit', () => {
    it('should still return progress: null', async () => {
      const created = await createHabit(responsavelToken, networkId, {
        name: 'Hábito customizado',
        frequency: 'CUSTOM',
      })
      const habitId = created.body.id

      const res = await request(app)
        .get(`/api/networks/${networkId}/habits`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      const habit = res.body.find((h) => h.id === habitId)
      expect(habit.progress).toBeNull()
    })
  })
})
