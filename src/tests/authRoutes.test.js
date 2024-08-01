const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const UserDetails = require('../models/userDetails');
const authRouter = require('../routes/authRoutes'); // Adjust the path to your router file

jest.mock('jsonwebtoken');
jest.mock('../models/userDetails');

const app = express();
app.use(express.json());
app.use('/api', authRouter);

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/login', () => {
    it('should return a token and user details for valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
        validatePassword: jest.fn().mockResolvedValue(true)
      };

      UserDetails.findOne = jest.fn().mockResolvedValue(mockUser);
      jwt.sign = jest.fn().mockReturnValue('mockToken');

      const response = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token: 'mockToken',
        user: { id: 1, email: 'test@example.com', role: 'user' }
      });
    });

    it('should return 401 for invalid credentials', async () => {
      UserDetails.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'wrongPassword' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should return 500 for server errors', async () => {
      UserDetails.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Server error during login' });
    });
  });

  describe('POST /api/register', () => {
    it('should register a new user and return a token', async () => {
      const mockNewUser = {
        id: 2,
        email: 'newuser@example.com',
        role: 'user'
      };

      UserDetails.findOne = jest.fn().mockResolvedValue(null);
      UserDetails.create = jest.fn().mockResolvedValue(mockNewUser);
      jwt.sign = jest.fn().mockReturnValue('mockToken');

      const response = await request(app)
        .post('/api/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'newuser@example.com',
          password: 'password123',
          phone: '1234567890',
          address: '123 Main St',
          isAdmin: false
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'User created successfully',
        token: 'mockToken',
        user: { id: 2, email: 'newuser@example.com', role: 'user' }
      });
    });

    it('should return 400 if the user already exists', async () => {
      UserDetails.findOne = jest.fn().mockResolvedValue({});

      const response = await request(app)
        .post('/api/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'existinguser@example.com',
          password: 'password123',
          phone: '1234567890',
          address: '123 Main St',
          isAdmin: false
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'User already exists' });
    });

    it('should return 500 for server errors', async () => {
      UserDetails.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'newuser@example.com',
          password: 'password123',
          phone: '1234567890',
          address: '123 Main St',
          isAdmin: false
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Server error during registration' });
    });
  });
});
