const request = require('supertest')
const express = require('express')
const configure = require('../app/config/express')

const app = express()
configure(app)

const RESPONSAVEL = {
  email: 'rede-responsavel@example.com',
  password: 'senha123',
  name: 'Responsável',
  phone: '11900000020',
}

async function register(user) {
  const res = await request(app).post('/auth/register').send(user)
  return { token: res.body.accessToken, id: res.body.user.id }
}

describe('POST /api/networks', () => {
  let responsavelToken

  beforeEach(async () => {
    ;({ token: responsavelToken } = await register(RESPONSAVEL))
  })

  it('returns a response shaped like findAllByUser entries, with permissions flattened at the top level', async () => {
    const createRes = await request(app)
      .post('/api/networks')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ name: 'Rede da Família' })

    expect(createRes.status).toBe(201)
    expect(createRes.body).not.toHaveProperty('members')
    expect(createRes.body).toMatchObject({
      name: 'Rede da Família',
      myRole: 'RESPONSAVEL',
      memberCount: 1,
      medicationAccess: 'EDIT',
      consultationAccess: 'EDIT',
      networkAccess: 'EDIT',
      recordsAccess: 'EDIT',
    })
    expect(createRes.body.joinedAt).toBeDefined()

    const listRes = await request(app)
      .get('/api/networks')
      .set('Authorization', `Bearer ${responsavelToken}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body).toHaveLength(1)
    expect(listRes.body[0]).toMatchObject({
      id: createRes.body.id,
      name: createRes.body.name,
      myRole: createRes.body.myRole,
      memberCount: createRes.body.memberCount,
      medicationAccess: createRes.body.medicationAccess,
      consultationAccess: createRes.body.consultationAccess,
      networkAccess: createRes.body.networkAccess,
      recordsAccess: createRes.body.recordsAccess,
    })
  })
})
