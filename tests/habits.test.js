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
