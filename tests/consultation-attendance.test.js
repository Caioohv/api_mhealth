const request = require('supertest');
const express = require('express');
const configure = require('../app/config/express');
const prisma = require('../app/config/prisma');

const app = express();
configure(app);

// Helper: register a user and return { token, userId }
async function registerUser(suffix) {
  const res = await request(app)
    .post('/auth/register')
    .send({
      email: `attendance-${suffix}@test.com`,
      password: 'password123',
      name: `User ${suffix}`,
    });
  expect(res.statusCode).toEqual(201);
  return { token: res.body.accessToken, userId: res.body.user.id };
}

// Helper: create a network and return networkId
async function createNetwork(token, suffix) {
  const res = await request(app)
    .post('/api/networks')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: `Test Network ${suffix}` });
  expect(res.statusCode).toEqual(201);
  return res.body.id;
}

// Helper: create a consultation in the network and return consultationId
async function createConsultation(token, networkId) {
  const res = await request(app)
    .post(`/api/networks/${networkId}/consultations`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Consulta Cardiologista',
      date: new Date(Date.now() - 86400000).toISOString(), // yesterday
    });
  expect(res.statusCode).toEqual(201);
  return res.body.id;
}

describe('PATCH /api/consultations/:id/attendance', () => {
  let ownerToken;
  let networkId;
  let consultationId;

  beforeEach(async () => {
    const owner = await registerUser('owner');
    ownerToken = owner.token;
    networkId = await createNetwork(ownerToken, 'att');
    consultationId = await createConsultation(ownerToken, networkId);
  });

  describe('success cases', () => {
    it('should mark attendance as ATTENDED and return updated consultation', async () => {
      const res = await request(app)
        .patch(`/api/consultations/${consultationId}/attendance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ attendanceStatus: 'ATTENDED' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', consultationId);
      expect(res.body).toHaveProperty('attendanceStatus', 'ATTENDED');
    });

    it('should mark attendance as MISSED', async () => {
      const res = await request(app)
        .patch(`/api/consultations/${consultationId}/attendance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ attendanceStatus: 'MISSED' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('attendanceStatus', 'MISSED');
    });

    it('should reset attendance back to PENDING', async () => {
      // First mark attended
      await request(app)
        .patch(`/api/consultations/${consultationId}/attendance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ attendanceStatus: 'ATTENDED' });

      // Then clear
      const res = await request(app)
        .patch(`/api/consultations/${consultationId}/attendance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ attendanceStatus: 'PENDING' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('attendanceStatus', 'PENDING');
    });

    it('should persist the status — GET returns the updated value', async () => {
      await request(app)
        .patch(`/api/consultations/${consultationId}/attendance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ attendanceStatus: 'ATTENDED' });

      const res = await request(app)
        .get(`/api/consultations/${consultationId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('attendanceStatus', 'ATTENDED');
    });
  });

  describe('validation errors', () => {
    it('should return 400 for an invalid attendanceStatus value', async () => {
      const res = await request(app)
        .patch(`/api/consultations/${consultationId}/attendance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ attendanceStatus: 'INVALID_STATUS' });

      expect(res.statusCode).toEqual(400);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('should return 400 when attendanceStatus is missing', async () => {
      const res = await request(app)
        .patch(`/api/consultations/${consultationId}/attendance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  describe('not found', () => {
    it('should return 404 for a non-existent consultation id', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .patch(`/api/consultations/${fakeId}/attendance`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ attendanceStatus: 'ATTENDED' });

      expect(res.statusCode).toEqual(404);
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  describe('permission guard', () => {
    it('should return 403 when the user is not a member of the network', async () => {
      const stranger = await registerUser('stranger');

      const res = await request(app)
        .patch(`/api/consultations/${consultationId}/attendance`)
        .set('Authorization', `Bearer ${stranger.token}`)
        .send({ attendanceStatus: 'ATTENDED' });

      expect(res.statusCode).toEqual(403);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('should return 403 when the user has VIEW-only consultationAccess', async () => {
      // Create a second user and add them to the network with VIEW access
      const viewer = await registerUser('viewer');

      // Add viewer to the network via Prisma directly (no invitation flow needed in tests)
      await prisma.networkMember.create({
        data: {
          userId: viewer.userId,
          networkId,
          role: 'ASSISTIDO',
          consultationAccess: 'VIEW',
          medicationAccess: 'NONE',
          networkAccess: 'NONE',
          recordsAccess: 'NONE',
          alertLevel: 'ALL',
        },
      });

      const res = await request(app)
        .patch(`/api/consultations/${consultationId}/attendance`)
        .set('Authorization', `Bearer ${viewer.token}`)
        .send({ attendanceStatus: 'ATTENDED' });

      expect(res.statusCode).toEqual(403);
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });
});
