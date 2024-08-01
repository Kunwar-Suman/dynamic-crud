const request = require('supertest');
const app = require('../../app'); // Adjust path if necessary
const jwt = require('jsonwebtoken');
const UserDetails = require('../models/userDetails');
const InternshipDetails = require('../models/internshipDetails');

const JWT_SECRET = 'test-secret-key';

// Mock models with simple implementations
jest.mock('../models/userDetails', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('../models/internshipDetails', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}));

describe('CRUD Endpoints', () => {
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET);

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // UserDetails CRUD Tests
  describe('UserDetails CRUD', () => {
    const mockUserData = [
      { id: 1, name: 'User1', role: 'admin' },
      { id: 2, name: 'User2', role: 'user' }
    ];

    it('GET /api/userdetails should return all users', async () => {
      UserDetails.findAll.mockResolvedValue(mockUserData);

      const response = await request(app)
        .get('/api/userdetails')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockUserData);
    });

    it('GET /api/userdetails/:id should return a user by id', async () => {
      UserDetails.findByPk.mockImplementation(id => Promise.resolve(mockUserData.find(user => user.id === Number(id))));

      const response = await request(app)
        .get('/api/userdetails/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ id: 1, name: 'User1', role: 'admin' });
    });

    it('POST /api/userdetails should create a new user', async () => {
      const newUser = { name: 'User3', role: 'user' };
      UserDetails.create.mockResolvedValue({ id: 3, ...newUser });

      const response = await request(app)
        .post('/api/userdetails')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser);

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ id: 3, ...newUser });
    });

    it('PUT /api/userdetails/:id should update an existing user', async () => {
      const updateData = { name: 'UpdatedUser' };
      UserDetails.findByPk.mockResolvedValue({ ...mockUserData[0], ...updateData });
      UserDetails.update.mockResolvedValue([1, [{ id: 1, ...updateData }]]); // Simulate successful update

      const response = await request(app)
        .put('/api/userdetails/1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ id: 1, ...updateData });
    });

    it('DELETE /api/userdetails/:id should delete a user', async () => {
      UserDetails.findByPk.mockResolvedValue(mockUserData[0]);
      UserDetails.destroy.mockResolvedValue(1); // Simulate successful deletion

      const response = await request(app)
        .delete('/api/userdetails/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: 'Deleted successfully' });
    });
  });

  // InternshipDetails CRUD Tests
  describe('InternshipDetails CRUD', () => {
    const mockInternshipData = [
      { id: 1, title: 'Internship1' },
      { id: 2, title: 'Internship2' }
    ];

    it('GET /api/internshipdetails should return all internships', async () => {
      InternshipDetails.findAll.mockResolvedValue(mockInternshipData);

      const response = await request(app)
        .get('/api/internshipdetails')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockInternshipData);
    });

    it('GET /api/internshipdetails/:id should return an internship by id', async () => {
      InternshipDetails.findByPk.mockImplementation(id => Promise.resolve(mockInternshipData.find(internship => internship.id === Number(id))));

      const response = await request(app)
        .get('/api/internshipdetails/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ id: 1, title: 'Internship1' });
    });

    it('POST /api/internshipdetails should create a new internship', async () => {
      const newInternship = { title: 'Internship3' };
      InternshipDetails.create.mockResolvedValue({ id: 3, ...newInternship });

      const response = await request(app)
        .post('/api/internshipdetails')
        .set('Authorization', `Bearer ${token}`)
        .send(newInternship);

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ id: 3, ...newInternship });
    });

    it('PUT /api/internshipdetails/:id should update an existing internship', async () => {
      const updateData = { title: 'UpdatedInternship' };
      InternshipDetails.findByPk.mockResolvedValue({ ...mockInternshipData[0], ...updateData });
      InternshipDetails.update.mockResolvedValue([1, [{ id: 1, ...updateData }]]); // Simulate successful update

      const response = await request(app)
        .put('/api/internshipdetails/1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ id: 1, ...updateData });
    });

    it('DELETE /api/internshipdetails/:id should delete an internship', async () => {
      InternshipDetails.findByPk.mockResolvedValue(mockInternshipData[0]);
      InternshipDetails.destroy.mockResolvedValue(1); // Simulate successful deletion

      const response = await request(app)
        .delete('/api/internshipdetails/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
    });
  });
});
