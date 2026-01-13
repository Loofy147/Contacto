import { PrismaClient } from '@prisma/client';
import { ContactService } from '../src/services/contact.service';
import { ServiceContext } from '../src/types';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    contact: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('ContactService', () => {
  let contactService: ContactService;
  let prisma: any;
  let context: ServiceContext;

  beforeEach(() => {
    prisma = new PrismaClient();
    contactService = new ContactService(prisma);
    context = {
      professionalId: 'prof-123',
      userId: 'user-123',
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a contact successfully', async () => {
      const mockContactData = {
        firstName: 'Ahmed',
        lastName: 'Benali',
        email: 'ahmed.benali@example.dz',
        phone: '0555123456',
        company: 'Benali Construction',
      };

      const mockCreatedContact = {
        id: 'contact-123',
        ...mockContactData,
        fullName: 'Ahmed Benali',
        professionalId: 'prof-123',
        type: 'LEAD',
        status: 'ACTIVE',
        tags: [],
        leadScore: 0,
        lifetimeValue: 0,
        totalDeals: 0,
        totalRevenue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.contact.findFirst.mockResolvedValue(null); // No duplicate
      prisma.contact.create.mockResolvedValue(mockCreatedContact);

      const result = await contactService.create(mockContactData, context);

      expect(result).toMatchObject({
        id: 'contact-123',
        fullName: 'Ahmed Benali',
        email: 'ahmed.benali@example.dz',
      });
      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'Ahmed',
          lastName: 'Benali',
          fullName: 'Ahmed Benali',
          professionalId: 'prof-123',
        }),
      });
    });

    it('should reject duplicate email', async () => {
      const mockContactData = {
        firstName: 'Ahmed',
        lastName: 'Benali',
        email: 'existing@example.dz',
      };

      prisma.contact.findFirst.mockResolvedValue({
        id: 'existing-contact',
        email: 'existing@example.dz',
      });

      await expect(
        contactService.create(mockContactData, context)
      ).rejects.toThrow('A contact with this email or phone already exists');
    });
  });

  describe('getById', () => {
    it('should return contact when found', async () => {
      const mockContact = {
        id: 'contact-123',
        fullName: 'Ahmed Benali',
        email: 'ahmed@example.dz',
        professionalId: 'prof-123',
        type: 'LEAD',
        status: 'ACTIVE',
        tags: [],
        leadScore: 75,
        lifetimeValue: 0,
        totalDeals: 0,
        totalRevenue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prisma.contact.findFirst.mockResolvedValue(mockContact);

      const result = await contactService.getById('contact-123', context);

      expect(result.id).toBe('contact-123');
      expect(result.leadScore).toBe(75);
    });

    it('should throw NotFoundError when contact does not exist', async () => {
      prisma.contact.findFirst.mockResolvedValue(null);

      await expect(
        contactService.getById('non-existent', context)
      ).rejects.toThrow('Contact with id non-existent not found');
    });
  });

  describe('list', () => {
    it('should return paginated contacts', async () => {
      const mockContacts = [
        {
          id: 'contact-1',
          fullName: 'Ahmed Benali',
          email: 'ahmed@example.dz',
          professionalId: 'prof-123',
          type: 'LEAD',
          status: 'ACTIVE',
          tags: [],
          leadScore: 80,
          lifetimeValue: 0,
          totalDeals: 0,
          totalRevenue: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'contact-2',
          fullName: 'Fatima Zerrouki',
          email: 'fatima@example.dz',
          professionalId: 'prof-123',
          type: 'CUSTOMER',
          status: 'ACTIVE',
          tags: ['vip'],
          leadScore: 95,
          lifetimeValue: 50000,
          totalDeals: 3,
          totalRevenue: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.contact.findMany.mockResolvedValue(mockContacts);
      prisma.contact.count.mockResolvedValue(2);

      const result = await contactService.list(
        { type: 'LEAD' },
        { page: 1, limit: 20 },
        context
      );

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter contacts by search term', async () => {
      prisma.contact.findMany.mockResolvedValue([]);
      prisma.contact.count.mockResolvedValue(0);

      await contactService.list(
        { search: 'Ahmed' },
        { page: 1, limit: 20 },
        context
      );

      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { fullName: { contains: 'Ahmed', mode: 'insensitive' } },
              { email: { contains: 'Ahmed', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update contact successfully', async () => {
      const existingContact = {
        id: 'contact-123',
        firstName: 'Ahmed',
        lastName: 'Benali',
        fullName: 'Ahmed Benali',
        professionalId: 'prof-123',
        deletedAt: null,
      };

      const updatedContact = {
        ...existingContact,
        phone: '0555999888',
        updatedAt: new Date(),
      };

      prisma.contact.findFirst.mockResolvedValue(existingContact);
      prisma.contact.findUnique.mockResolvedValue(existingContact);
      prisma.contact.update.mockResolvedValue(updatedContact);

      const result = await contactService.update(
        'contact-123',
        { phone: '0555999888' },
        context
      );

      expect(result.id).toBe('contact-123');
      expect(prisma.contact.update).toHaveBeenCalledWith({
        where: { id: 'contact-123' },
        data: expect.objectContaining({ phone: '0555999888' }),
      });
    });
  });

  describe('delete', () => {
    it('should soft delete contact', async () => {
      const existingContact = {
        id: 'contact-123',
        fullName: 'Ahmed Benali',
        professionalId: 'prof-123',
        deletedAt: null,
      };

      prisma.contact.findFirst.mockResolvedValue(existingContact);
      prisma.contact.update.mockResolvedValue({
        ...existingContact,
        deletedAt: new Date(),
      });

      await contactService.delete('contact-123', context);

      expect(prisma.contact.update).toHaveBeenCalledWith({
        where: { id: 'contact-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('getFollowUpContacts', () => {
    it('should return contacts needing follow-up', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockContacts = [
        {
          id: 'contact-1',
          fullName: 'Ahmed Benali',
          nextFollowUpDate: yesterday,
          status: 'ACTIVE',
          deletedAt: null,
        },
      ];

      prisma.contact.findMany.mockResolvedValue(mockContacts);

      const result = await contactService.getFollowUpContacts(context);

      expect(result).toHaveLength(1);
      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nextFollowUpDate: { lte: expect.any(Date) },
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('getMetrics', () => {
    it('should calculate contact metrics correctly', async () => {
      const mockContacts = [
        {
          type: 'LEAD',
          source: 'WEBSITE',
          leadScore: 80,
          totalDeals: 0,
        },
        {
          type: 'LEAD',
          source: 'REFERRAL',
          leadScore: 90,
          totalDeals: 1,
        },
        {
          type: 'CUSTOMER',
          source: 'WEBSITE',
          leadScore: 100,
          totalDeals: 3,
        },
      ];

      prisma.contact.findMany.mockResolvedValue(mockContacts);

      const result = await contactService.getMetrics(context);

      expect(result.totalContacts).toBe(3);
      expect(result.averageLeadScore).toBe(90);
      expect(result.conversionRate).toBeGreaterThan(0);
      expect(result.byType).toHaveProperty('LEAD');
      expect(result.byType).toHaveProperty('CUSTOMER');
    });
  });
});
