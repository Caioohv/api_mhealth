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

const ASSISTIDO = {
  email: 'assistido@example.com',
  password: 'senha123',
  name: 'Idoso',
  phone: '11900000002',
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

async function inviteAndJoin(responsavelToken, networkId, assistidoToken, permissions = {}) {
  const invRes = await request(app)
    .post(`/api/networks/${networkId}/invitations`)
    .set('Authorization', `Bearer ${responsavelToken}`)
    .send({
      invitedEmail: ASSISTIDO.email,
      proposedRole: 'ASSISTIDO',
      consultationAccess: 'VIEW',
      ...permissions,
    })

  await request(app)
    .post(`/api/invitations/${invRes.body.token}/accept`)
    .set('Authorization', `Bearer ${assistidoToken}`)
}

async function createConsultation(token, networkId, data = {}) {
  return request(app)
    .post(`/api/networks/${networkId}/consultations`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Consulta Cardiologista',
      date: new Date(Date.now() + 86400000).toISOString(),
      type: 'CONSULTA',
      ...data,
    })
}

describe('Consultations', () => {
  let responsavelToken
  let assistidoToken
  let networkId

  beforeEach(async () => {
    ;({ token: responsavelToken } = await register(RESPONSAVEL))
    ;({ token: assistidoToken } = await register(ASSISTIDO))
    const network = await createNetwork(responsavelToken)
    networkId = network.id
  })

  // ─── POST /api/networks/:id/consultations ──────────────────────────────────

  describe('POST /api/networks/:id/consultations', () => {
    it('should create a consultation with valid body and EDIT access', async () => {
      const res = await createConsultation(responsavelToken, networkId)

      expect(res.statusCode).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.title).toBe('Consulta Cardiologista')
      expect(res.body.type).toBe('CONSULTA')
      expect(res.body.networkId).toBe(networkId)
    })

    it('should return 403 when member has consultationAccess: VIEW', async () => {
      await inviteAndJoin(responsavelToken, networkId, assistidoToken, { consultationAccess: 'VIEW' })

      const res = await createConsultation(assistidoToken, networkId)

      expect(res.statusCode).toBe(403)
    })

    it('should return 400 when title has fewer than 3 chars', async () => {
      const res = await createConsultation(responsavelToken, networkId, { title: 'AB' })

      expect(res.statusCode).toBe(400)
    })

    it('should return 400 when date is missing', async () => {
      const res = await request(app)
        .post(`/api/networks/${networkId}/consultations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ title: 'Consulta válida', type: 'CONSULTA' })

      expect(res.statusCode).toBe(400)
    })

    it('should return 400 when date is not a valid ISO format', async () => {
      const res = await createConsultation(responsavelToken, networkId, { date: 'nao-e-uma-data' })

      expect(res.statusCode).toBe(400)
    })
  })

  // ─── GET /api/networks/:id/consultations ──────────────────────────────────

  describe('GET /api/networks/:id/consultations', () => {
    it('should return an array of consultations', async () => {
      await createConsultation(responsavelToken, networkId)
      await createConsultation(responsavelToken, networkId, { title: 'Outra consulta' })

      const res = await request(app)
        .get(`/api/networks/${networkId}/consultations`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(2)
    })

    it('should filter by startDate and endDate', async () => {
      const pastDate = new Date(Date.now() - 86400000 * 30).toISOString()
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString()

      await createConsultation(responsavelToken, networkId, { date: pastDate, title: 'Passada' })
      await createConsultation(responsavelToken, networkId, { date: futureDate, title: 'Futura' })

      const startDate = new Date(Date.now()).toISOString()
      const endDate = new Date(Date.now() + 86400000 * 60).toISOString()

      const res = await request(app)
        .get(`/api/networks/${networkId}/consultations?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].title).toBe('Futura')
    })

    it('should return 403 when a RESPONSAVEL member has consultationAccess: NONE', async () => {
      // A second RESPONSAVEL with NONE consultationAccess is denied
      const { email: email2, password: password2, name: name2 } = {
        email: 'outro@example.com', password: 'senha123', name: 'Outro'
      }
      const { token: otherToken } = await register({ email: email2, password: password2, name: name2 })

      // invite as RESPONSAVEL with no consultation access
      const invRes = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({
          invitedEmail: email2,
          proposedRole: 'RESPONSAVEL',
          consultationAccess: 'NONE',
        })
      await request(app)
        .post(`/api/invitations/${invRes.body.token}/accept`)
        .set('Authorization', `Bearer ${otherToken}`)

      const res = await request(app)
        .get(`/api/networks/${networkId}/consultations`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.statusCode).toBe(403)
    })

    it('should return 200 for ASSISTIDO with consultationAccess: VIEW', async () => {
      await inviteAndJoin(responsavelToken, networkId, assistidoToken, { consultationAccess: 'VIEW' })
      await createConsultation(responsavelToken, networkId)

      const res = await request(app)
        .get(`/api/networks/${networkId}/consultations`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })

  // ─── GET /api/consultations/:id ────────────────────────────────────────────

  describe('GET /api/consultations/:id', () => {
    it('should return consultation details with valid id', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      const res = await request(app)
        .get(`/api/consultations/${id}`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.id).toBe(id)
    })

    it('should return 401 without token (auth gap closed)', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      const res = await request(app).get(`/api/consultations/${id}`)

      expect(res.statusCode).toBe(401)
    })
  })

  // ─── PATCH /api/consultations/:id ──────────────────────────────────────────

  describe('PATCH /api/consultations/:id', () => {
    it('should update a consultation with valid data', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      const res = await request(app)
        .patch(`/api/consultations/${id}`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ title: 'Titulo atualizado', date: new Date(Date.now() + 86400000).toISOString() })

      expect(res.statusCode).toBe(200)
      expect(res.body.title).toBe('Titulo atualizado')
    })

    it('should return 401 without token (auth gap closed)', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      const res = await request(app)
        .patch(`/api/consultations/${id}`)
        .send({ title: 'Titulo', date: new Date(Date.now() + 86400000).toISOString() })

      expect(res.statusCode).toBe(401)
    })
  })

  // ─── PATCH /api/consultations/:id/attendance ───────────────────────────────

  describe('PATCH /api/consultations/:id/attendance', () => {
    it('should mark a consultation as ATTENDED', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      const res = await request(app)
        .patch(`/api/consultations/${id}/attendance`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ attendanceStatus: 'ATTENDED' })

      expect(res.statusCode).toBe(200)
      expect(res.body.attendanceStatus).toBe('ATTENDED')
    })

    it('should mark a consultation as MISSED', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      const res = await request(app)
        .patch(`/api/consultations/${id}/attendance`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ attendanceStatus: 'MISSED' })

      expect(res.statusCode).toBe(200)
      expect(res.body.attendanceStatus).toBe('MISSED')
    })

    it('should reset attendance back to PENDING', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      await request(app)
        .patch(`/api/consultations/${id}/attendance`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ attendanceStatus: 'ATTENDED' })

      const res = await request(app)
        .patch(`/api/consultations/${id}/attendance`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ attendanceStatus: 'PENDING' })

      expect(res.statusCode).toBe(200)
      expect(res.body.attendanceStatus).toBe('PENDING')
    })

    it('should return 400 for an invalid attendanceStatus value', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      const res = await request(app)
        .patch(`/api/consultations/${id}/attendance`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ attendanceStatus: 'NOT_A_STATUS' })

      expect(res.statusCode).toBe(400)
    })

    it('should return 401 without token (auth gap closed)', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      const res = await request(app)
        .patch(`/api/consultations/${id}/attendance`)
        .send({ attendanceStatus: 'ATTENDED' })

      expect(res.statusCode).toBe(401)
    })
  })

  // ─── DELETE /api/consultations/:id ────────────────────────────────────────

  describe('DELETE /api/consultations/:id', () => {
    it('should delete a consultation and return 204', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      const res = await request(app)
        .delete(`/api/consultations/${id}`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(res.statusCode).toBe(204)
    })

    it('should return 401 without token (auth gap closed)', async () => {
      const created = await createConsultation(responsavelToken, networkId)
      const id = created.body.id

      const res = await request(app).delete(`/api/consultations/${id}`)

      expect(res.statusCode).toBe(401)
    })
  })

  // ─── GET /api/networks/:id/consultations/reminders ────────────────────────

  describe('GET /api/networks/:id/consultations/reminders', () => {
    it('should return only consultations within the days window', async () => {
      const soonDate = new Date(Date.now() + 86400000 * 2).toISOString()
      const farDate = new Date(Date.now() + 86400000 * 60).toISOString()

      await createConsultation(responsavelToken, networkId, { date: soonDate, title: 'Em breve' })
      await createConsultation(responsavelToken, networkId, { date: farDate, title: 'Distante' })

      const res = await request(app)
        .get(`/api/networks/${networkId}/consultations/reminders?days=7`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.some((c) => c.title === 'Em breve')).toBe(true)
      expect(res.body.some((c) => c.title === 'Distante')).toBe(false)
    })
  })
})
