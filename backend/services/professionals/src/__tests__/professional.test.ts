import request from 'supertest';
import express from 'express';
import { professionalRoutes } from '../routes/professional.routes';
import { errorHandler } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

jest.mock('../lib/prisma', () => ({
  prisma: {
    professional: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

jest.mock('../lib/kafka', () => ({
  kafka: {
    send: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../lib/meilisearch', () => ({
  meilisearch: {
    index: jest.fn().mockReturnValue({
      addDocuments: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue({ hits: [], estimatedTotalHits: 0 }),
    }),
  },
}));

const app = express();
app.use(express.json());
// Mock user for authenticate middleware
app.use((req: any, res, next) => {
  req.user = { userId: 'user-123', email: 'test@example.com', role: 'USER' };
  next();
});
app.use('/api/v1/professionals', professionalRoutes);
app.use(errorHandler);

describe('Professional Routes', () => {
  describe('POST /api/v1/professionals', () => {
    it('should create a professional profile successfully', async () => {
      (prisma.professional.findUnique as any).mockResolvedValue(null);
      (prisma.professional.findFirst as any).mockResolvedValue(null);
      (prisma.professional.create as any).mockResolvedValue({
        id: 'prof-123',
        businessName: 'Test Biz',
        slug: 'test-biz',
      });

      const res = await request(app)
        .post('/api/v1/professionals')
        .send({
          categoryId: '00000000-0000-0000-0000-000000000000',
          businessName: 'Test Biz',
          wilaya: 'Algiers',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
