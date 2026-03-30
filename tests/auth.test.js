const request = require('supertest');
const express = require('express');
const configure = require('../app/config/express');
const prisma = require('../app/config/prisma');

const app = express();
configure(app);

describe('Auth Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    phone: '123456789'
  };

  describe('POST /auth/register', () => {
    it('should create a new account successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('name', testUser.name);
    });

    it('should return 409 if email already exists', async () => {
      // First registration
      await request(app).post('/auth/register').send(testUser);

      // Duplicate registration
      const res = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(409);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Register user before login tests
      await request(app).post('/auth/register').send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should fail to login with incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should fail to login with non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        });

      expect(res.statusCode).toEqual(401);
    });
  });
});
