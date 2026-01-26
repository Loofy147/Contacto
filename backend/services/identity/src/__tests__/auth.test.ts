import request from 'supertest';
import express from 'express';
import { authRoutes } from '../routes/auth.routes';
import { errorHandler } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

// Mock prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  },
}));

// Mock kafka
jest.mock('../lib/kafka', () => ({
  kafka: {
    send: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock redis
jest.mock('../lib/redis', () => ({
  redis: {
    get: jest.fn(),
    setEx: jest.fn(),
  },
}));

// Mock JWT
jest.mock('../utils/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock-token'),
  generateRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
  verifyToken: jest.fn().mockReturnValue({ userId: 'user-123', email: 'test@example.com', role: 'USER' }),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use(errorHandler);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should return 409 if user exists', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USER_EXISTS');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user from cache if available', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      (redis.get as jest.Mock)
        .mockResolvedValueOnce(null) // blacklist check
        .mockResolvedValueOnce(JSON.stringify(mockUser)); // profile cache

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.data.user).toEqual(mockUser);
      expect(res.body.message).toBe('User profile retrieved from cache');
      expect(redis.get).toHaveBeenCalledWith('blacklist:mock-token');
      expect(redis.get).toHaveBeenCalledWith('user:profile:user-123');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch user from DB and cache it if not in cache', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      (redis.get as jest.Mock).mockResolvedValue(null); // Both blacklist and profile cache miss
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.data.user).toEqual(mockUser);
      expect(res.body.message).toBe('User profile retrieved successfully');
      expect(redis.get).toHaveBeenCalledWith('user:profile:user-123');
      expect(prisma.user.findUnique).toHaveBeenCalled();
      expect(redis.setEx).toHaveBeenCalledWith('user:profile:user-123', 300, JSON.stringify(mockUser));
    });
  });
});
