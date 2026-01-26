import request from 'supertest';
import express from 'express';
import { analyticsRoutes } from '../routes/analytics.routes';
import { errorHandler } from '../middleware/errorHandler';

jest.mock('../lib/prisma', () => ({
  prisma: {
    professional: {
      findUnique: jest.fn().mockResolvedValue({ id: 'prof-123' }),
    },
    review: {
      aggregate: jest.fn().mockResolvedValue({ _avg: { overallRating: 4.5 } }),
      count: jest.fn().mockResolvedValue(10),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    appointment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  },
}));

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { userId: 'user-123', email: 'test@example.com', role: 'PROFESSIONAL' };
  next();
});
app.use('/api/v1/analytics', analyticsRoutes);
app.use(errorHandler);

describe('Analytics Routes', () => {
  it('should get dashboard overview', async () => {
    const res = await request(app).get('/api/v1/analytics/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
