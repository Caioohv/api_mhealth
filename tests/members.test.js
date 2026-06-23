const request = require('supertest')
const express = require('express')
const configure = require('../app/config/express')

const app = express()
configure(app)

const OWNER = {
  email: 'owner@example.com',
  password: 'senha123',
  name: 'Dono da Rede',
  phone: '11900000010',
}

const MEMBER = {
  email: 'membro@example.com',
  password: 'senha123',
  name: 'Membro Comum',
  phone: '11900000011',
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

async function getMembers(token, networkId) {
  const res = await request(app)
    .get(`/api/networks/${networkId}/members`)
    .set('Authorization', `Bearer ${token}`)
  return res.body
}

async function inviteAndAccept(ownerToken, networkId, memberToken, memberId) {
  const invRes = await request(app)
    .post(`/api/networks/${networkId}/invitations`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ invitedEmail: MEMBER.email, proposedRole: 'ASSISTIDO' })
  const inviteToken = invRes.body.token

  await request(app)
    .post(`/api/invitations/${inviteToken}/accept`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({})
}

describe('Member Permissions — creator networkAccess guard', () => {
  let ownerToken, ownerId
  let memberToken, memberId
  let networkId, ownerMemberId, regularMemberId

  beforeEach(async () => {
    ;({ token: ownerToken, id: ownerId } = await register(OWNER))
    ;({ token: memberToken, id: memberId } = await register(MEMBER))

    const network = await createNetwork(ownerToken)
    networkId = network.id

    await inviteAndAccept(ownerToken, networkId, memberToken, memberId)

    const members = await getMembers(ownerToken, networkId)
    ownerMemberId = members.find((m) => m.userId === ownerId).id
    regularMemberId = members.find((m) => m.userId === memberId).id
  })

  // AC-1: downgrade to NONE is rejected
  it('returns 400 when attempting to set creator networkAccess to NONE', async () => {
    const res = await request(app)
      .patch(`/api/networks/${networkId}/members/${ownerMemberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ networkAccess: 'NONE' })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toMatch(/networkAccess/i)
  })

  // AC-1 (VIEW variant)
  it('returns 400 when attempting to set creator networkAccess to VIEW', async () => {
    const res = await request(app)
      .patch(`/api/networks/${networkId}/members/${ownerMemberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ networkAccess: 'VIEW' })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toMatch(/networkAccess/i)
  })

  // AC-2: idempotent EDIT succeeds
  it('succeeds (200) when setting creator networkAccess to EDIT', async () => {
    const res = await request(app)
      .patch(`/api/networks/${networkId}/members/${ownerMemberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ networkAccess: 'EDIT' })

    expect(res.statusCode).toBe(200)
    expect(res.body.networkAccess).toBe('EDIT')
  })

  // AC-3: other permission fields for creator still work
  it('allows updating medicationAccess for the creator', async () => {
    const res = await request(app)
      .patch(`/api/networks/${networkId}/members/${ownerMemberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ medicationAccess: 'VIEW' })

    expect(res.statusCode).toBe(200)
    expect(res.body.medicationAccess).toBe('VIEW')
  })

  // AC-6: non-creator members can have networkAccess changed freely
  it('allows setting networkAccess to NONE for a regular member', async () => {
    const res = await request(app)
      .patch(`/api/networks/${networkId}/members/${regularMemberId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ networkAccess: 'NONE' })

    expect(res.statusCode).toBe(200)
    expect(res.body.networkAccess).toBe('NONE')
  })
})
