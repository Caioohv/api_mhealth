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

const ANOTHER_RESPONSAVEL = {
  email: 'outro@example.com',
  password: 'senha123',
  name: 'Outro Responsável',
  phone: '11900000003',
}

async function register(user) {
  const res = await request(app).post('/auth/register').send(user)
  return { token: res.body.token, id: res.body.user.id }
}

async function createNetwork(token, data = { name: 'Rede Teste' }) {
  const res = await request(app)
    .post('/api/networks')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
  return res.body
}

describe('Invitation System', () => {
  let responsavelToken, responsavelId
  let assistidoToken, assistidoId
  let anotherToken
  let networkId

  beforeEach(async () => {
    ;({ token: responsavelToken, id: responsavelId } = await register(RESPONSAVEL))
    ;({ token: assistidoToken, id: assistidoId } = await register(ASSISTIDO))
    ;({ token: anotherToken } = await register(ANOTHER_RESPONSAVEL))

    const network = await createNetwork(responsavelToken)
    networkId = network.id
  })

  describe('POST /api/networks/:id/invitations', () => {
    it('should create an invitation for an assistido by email', async () => {
      const res = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({
          invitedEmail: ASSISTIDO.email,
          proposedRole: 'ASSISTIDO',
          medicationAccess: 'VIEW',
          consultationAccess: 'VIEW',
          recordsAccess: 'VIEW',
        })

      expect(res.statusCode).toBe(201)
      expect(res.body).toHaveProperty('token')
      expect(res.body).toHaveProperty('inviteLink')
      expect(res.body.status).toBe('PENDING')
      expect(res.body.proposedRole).toBe('ASSISTIDO')
      expect(res.body.invitedEmail).toBe(ASSISTIDO.email)
    })

    it('should create an invitation for another responsavel', async () => {
      const res = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({
          invitedEmail: ANOTHER_RESPONSAVEL.email,
          proposedRole: 'RESPONSAVEL',
          medicationAccess: 'EDIT',
          consultationAccess: 'EDIT',
          networkAccess: 'EDIT',
          recordsAccess: 'EDIT',
        })

      expect(res.statusCode).toBe(201)
      expect(res.body.proposedRole).toBe('RESPONSAVEL')
      expect(res.body.networkAccess).toBe('EDIT')
    })

    it('should reject invite if neither email nor phone provided', async () => {
      const res = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ proposedRole: 'ASSISTIDO' })

      expect(res.statusCode).toBe(400)
    })

    it('should deny invite for non-member', async () => {
      const res = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${assistidoToken}`)
        .send({
          invitedEmail: 'alguem@example.com',
          proposedRole: 'ASSISTIDO',
        })

      expect(res.statusCode).toBe(403)
    })

    it('should deny invite for member without networkAccess=EDIT', async () => {
      // First accept assistido into network with no networkAccess
      const invRes = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({
          invitedEmail: ASSISTIDO.email,
          proposedRole: 'ASSISTIDO',
          networkAccess: 'NONE',
        })
      const invToken = invRes.body.token

      await request(app)
        .post(`/api/invitations/${invToken}/accept`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      // Now assistido tries to invite someone
      const res = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${assistidoToken}`)
        .send({
          invitedEmail: 'novo@example.com',
          proposedRole: 'ASSISTIDO',
        })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('GET /api/networks/:id/invitations', () => {
    it('should list invitations for the network', async () => {
      await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ invitedEmail: ASSISTIDO.email, proposedRole: 'ASSISTIDO' })

      const res = await request(app)
        .get(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].invitedEmail).toBe(ASSISTIDO.email)
    })

    it('should deny listing invitations for non-members', async () => {
      const res = await request(app)
        .get(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${anotherToken}`)

      expect(res.statusCode).toBe(403)
    })
  })

  describe('GET /api/invitations', () => {
    it('should list pending invitations for the authenticated user by email', async () => {
      await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ invitedEmail: ASSISTIDO.email, proposedRole: 'ASSISTIDO' })

      const res = await request(app)
        .get('/api/invitations')
        .set('Authorization', `Bearer ${assistidoToken}`)

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].network.id).toBe(networkId)
    })
  })

  describe('GET /api/invitations/:token', () => {
    it('should return invitation details by token', async () => {
      const invRes = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ invitedEmail: ASSISTIDO.email, proposedRole: 'ASSISTIDO' })

      const res = await request(app)
        .get(`/api/invitations/${invRes.body.token}`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.status).toBe('PENDING')
      expect(res.body).toHaveProperty('expired')
    })

    it('should return 404 for invalid token', async () => {
      const res = await request(app)
        .get('/api/invitations/invalid-token-xyz')
        .set('Authorization', `Bearer ${assistidoToken}`)

      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /api/invitations/:token/accept', () => {
    let inviteToken

    beforeEach(async () => {
      const invRes = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({
          invitedEmail: ASSISTIDO.email,
          proposedRole: 'ASSISTIDO',
          medicationAccess: 'VIEW',
        })
      inviteToken = invRes.body.token
    })

    it('should accept invitation and create network membership', async () => {
      const res = await request(app)
        .post(`/api/invitations/${inviteToken}/accept`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      expect(res.statusCode).toBe(201)
      expect(res.body.role).toBe('ASSISTIDO')
      expect(res.body.medicationAccess).toBe('VIEW')
    })

    it('should apply proposed permissions when accepting', async () => {
      await request(app)
        .post(`/api/invitations/${inviteToken}/accept`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      const membersRes = await request(app)
        .get(`/api/networks/${networkId}/members`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      const assistidoMember = membersRes.body.find((m) => m.user.id === assistidoId)
      expect(assistidoMember).toBeDefined()
      expect(assistidoMember.role).toBe('ASSISTIDO')
      expect(assistidoMember.medicationAccess).toBe('VIEW')
    })

    it('should return 409 if user is already a member', async () => {
      await request(app)
        .post(`/api/invitations/${inviteToken}/accept`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      // Create another invite for same user
      const invRes2 = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ invitedPhone: ASSISTIDO.phone, proposedRole: 'ASSISTIDO' })

      const res = await request(app)
        .post(`/api/invitations/${invRes2.body.token}/accept`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      expect(res.statusCode).toBe(409)
    })

    it('should return 400 if invitation is already accepted', async () => {
      await request(app)
        .post(`/api/invitations/${inviteToken}/accept`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      const res = await request(app)
        .post(`/api/invitations/${inviteToken}/accept`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('POST /api/invitations/:token/reject', () => {
    it('should reject an invitation', async () => {
      const invRes = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ invitedEmail: ASSISTIDO.email, proposedRole: 'ASSISTIDO' })

      const res = await request(app)
        .post(`/api/invitations/${invRes.body.token}/reject`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      expect(res.statusCode).toBe(204)
    })

    it('should return 400 when rejecting an already-rejected invitation', async () => {
      const invRes = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ invitedEmail: ASSISTIDO.email, proposedRole: 'ASSISTIDO' })

      await request(app)
        .post(`/api/invitations/${invRes.body.token}/reject`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      const res = await request(app)
        .post(`/api/invitations/${invRes.body.token}/reject`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('DELETE /api/invitations/:id (cancel)', () => {
    it('should cancel a pending invitation', async () => {
      const invRes = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ invitedEmail: ASSISTIDO.email, proposedRole: 'ASSISTIDO' })

      const res = await request(app)
        .delete(`/api/invitations/${invRes.body.id}`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(res.statusCode).toBe(204)
    })

    it('should deny cancellation by non-inviter', async () => {
      const invRes = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ invitedEmail: ASSISTIDO.email, proposedRole: 'ASSISTIDO' })

      const res = await request(app)
        .delete(`/api/invitations/${invRes.body.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)

      expect(res.statusCode).toBe(403)
    })

    it('should return 400 when canceling an already-accepted invitation', async () => {
      const invRes = await request(app)
        .post(`/api/networks/${networkId}/invitations`)
        .set('Authorization', `Bearer ${responsavelToken}`)
        .send({ invitedEmail: ASSISTIDO.email, proposedRole: 'ASSISTIDO' })

      await request(app)
        .post(`/api/invitations/${invRes.body.token}/accept`)
        .set('Authorization', `Bearer ${assistidoToken}`)

      const res = await request(app)
        .delete(`/api/invitations/${invRes.body.id}`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('Network creator auto-becomes RESPONSAVEL', () => {
    it('should give creator full EDIT permissions on all access fields', async () => {
      const res = await request(app)
        .get(`/api/networks/${networkId}/permissions`)
        .set('Authorization', `Bearer ${responsavelToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.role).toBe('RESPONSAVEL')
      expect(res.body.medicationAccess).toBe('EDIT')
      expect(res.body.consultationAccess).toBe('EDIT')
      expect(res.body.networkAccess).toBe('EDIT')
      expect(res.body.recordsAccess).toBe('EDIT')
    })
  })
})
