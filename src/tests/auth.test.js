const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Mocking jsonwebtoken.verify
jest.mock('jsonwebtoken');

describe('Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should call next if token is valid', () => {
      const user = { role: 'user' };
      jwt.verify.mockImplementation((token, secret, callback) => callback(null, user));
      req.headers = { authorization: 'Bearer validToken' };

      authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('validToken', 'your-secret-key', expect.any(Function));
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    it('should send 401 if no token is provided', () => {
      req.headers = {};

      authenticateToken(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should send 403 if token is invalid', () => {
      jwt.verify.mockImplementation((token, secret, callback) => callback(new Error('Invalid token'), null));
      req.headers = { authorization: 'Bearer invalidToken' };

      authenticateToken(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRole', () => {
    it('should call next if user role is authorized', () => {
      req.user = { role: 'admin' };
      const roles = ['admin', 'editor'];

      authorizeRole(roles)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should send 403 if user role is not authorized', () => {
      req.user = { role: 'user' };
      const roles = ['admin', 'editor'];

      authorizeRole(roles)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
