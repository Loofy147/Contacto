import crypto from "crypto";
// backend/services/professionals/src/controllers/professional.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { meilisearch } from '../lib/meilisearch';
import { kafka } from '../lib/kafka';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import slugify from 'slugify';

export class ProfessionalController {
  /**
   * Create professional profile
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { categoryId, businessName, bio, phone, email, wilaya, commune, ...restData } = req.body;

      // Check if user already has a professional profile
      const existing = await prisma.professional.findUnique({
        where: { userId },
      });

      if (existing) {
        throw new AppError(400, 'PROFILE_EXISTS', 'Professional profile already exists');
      }

      // Generate unique slug
      let slug = slugify(businessName, { lower: true, strict: true });
      let slugExists = await prisma.professional.findUnique({ where: { slug } });
      let counter = 1;

      while (slugExists) {
        slug = `${slugify(businessName, { lower: true, strict: true })}-${counter}`;
        slugExists = await prisma.professional.findUnique({ where: { slug } });
        counter++;
      }

      // Create professional profile
      const professional = await prisma.professional.create({
        data: {
          userId,
          categoryId,
          businessName,
          slug,
          bio,
          phone,
          email,
          wilaya,
          commune,
          ...restData,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          category: true,
        },
      });

      // Update user role
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'PROFESSIONAL' },
      });

      // Index in Meilisearch
      await this.indexProfessional(professional);

      // Publish event
      await kafka.send({
        topic: 'professional.events',
        messages: [{
          key: professional.id,
          value: JSON.stringify({
            eventType: 'PROFESSIONAL_CREATED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: { professionalId: professional.id, userId },
          }),
        }],
      });

      logger.info('Professional profile created', { professionalId: professional.id, userId });

      res.status(201).json({
        success: true,
        message: 'Professional profile created successfully',
        data: { professional },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get professional by ID or slug
   */
  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Try cache first
      const cacheKey = `professional:${id}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        logger.debug('Professional retrieved from cache', { id });
        return res.json({
          success: true,
          data: { professional: JSON.parse(cached) },
        });
      }

      // Fetch from database
      const professional = await prisma.professional.findFirst({
        where: {
          OR: [
            { id },
            { slug: id },
          ],
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          category: true,
          services: {
            orderBy: { sortOrder: 'asc' },
          },
          portfolio: {
            orderBy: { sortOrder: 'asc' },
          },
          reviews: {
            where: { isApproved: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional not found');
      }

      // Increment view count (async, don't wait)
      this.incrementViews(professional.id, req.ip, req.headers['user-agent']).catch(err =>
        logger.error('Failed to increment views', { error: err, professionalId: professional.id })
      );

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(professional));

      res.json({
        success: true,
        data: { professional },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search professionals
   */
  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        q = '',
        categoryId,
        wilaya,
        minRating,
        verifiedOnly,
        latitude,
        longitude,
        radius = 10000, // 10km default
        page = 1,
        limit = 20,
        sortBy = 'relevance',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Build Meilisearch filter
      const filters: string[] = [];
      
      if (categoryId) filters.push(`categoryId = "${categoryId}"`);
      if (wilaya) filters.push(`wilaya = "${wilaya}"`);
      if (minRating) filters.push(`averageRating >= ${minRating}`);
      if (verifiedOnly === 'true') filters.push('isVerified = true');

      // Geo filter
      if (latitude && longitude) {
        filters.push(`_geoRadius(${latitude}, ${longitude}, ${radius})`);
      }

      // Search
      const results = await meilisearch.index('professionals').search(q as string, {
        filter: filters.length > 0 ? filters.join(' AND ') : undefined,
        sort: this.getSortRules(sortBy as string),
        limit: Number(limit),
        offset,
        attributesToHighlight: ['businessName', 'bio'],
      });

      // Get full professional data from database
      const professionalIds = results.hits.map((hit: any) => hit.id);
      
      const professionals = await prisma.professional.findMany({
        where: {
          id: { in: professionalIds },
          deletedAt: null,
        },
        include: {
          category: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Maintain search result order
      const orderedProfessionals = professionalIds.map(id =>
        professionals.find(p => p.id === id)
      ).filter(Boolean);

      res.json({
        success: true,
        data: {
          professionals: orderedProfessionals,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: results.estimatedTotalHits,
            totalPages: Math.ceil(results.estimatedTotalHits / Number(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update professional profile
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const updates = req.body;

      // Find professional
      const professional = await prisma.professional.findUnique({
        where: { userId },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional profile not found');
      }

      // Update slug if business name changed
      if (updates.businessName && updates.businessName !== professional.businessName) {
        let slug = slugify(updates.businessName, { lower: true, strict: true });
        let slugExists = await prisma.professional.findFirst({
          where: { slug, id: { not: professional.id } },
        });
        let counter = 1;

        while (slugExists) {
          slug = `${slugify(updates.businessName, { lower: true, strict: true })}-${counter}`;
          slugExists = await prisma.professional.findFirst({
            where: { slug, id: { not: professional.id } },
          });
          counter++;
        }

        updates.slug = slug;
      }

      // Update professional
      const updated = await prisma.professional.update({
        where: { id: professional.id },
        data: updates,
        include: {
          category: true,
          services: true,
        },
      });

      // Invalidate cache
      await redis.del(`professional:${professional.id}`);
      await redis.del(`professional:${professional.slug}`);

      // Update search index
      await this.indexProfessional(updated);

      // Publish event
      await kafka.send({
        topic: 'professional.events',
        messages: [{
          key: updated.id,
          value: JSON.stringify({
            eventType: 'PROFESSIONAL_UPDATED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: { professionalId: updated.id },
          }),
        }],
      });

      logger.info('Professional profile updated', { professionalId: updated.id });

      res.json({
        success: true,
        message: 'Professional profile updated successfully',
        data: { professional: updated },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get nearby professionals
   */
  getNearby = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { latitude, longitude, radius = 10000, limit = 20 } = req.query;

      if (!latitude || !longitude) {
        throw new AppError(400, 'MISSING_LOCATION', 'Latitude and longitude are required');
      }

      // Use PostgreSQL with PostGIS for geographic queries
      const professionals = await prisma.$queryRaw`
        SELECT 
          p.*,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${Number(longitude)}, ${Number(latitude)}), 4326)::geography
          ) / 1000 AS distance_km
        FROM professionals p
        WHERE 
          p.deleted_at IS NULL
          AND p.latitude IS NOT NULL
          AND p.longitude IS NOT NULL
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${Number(longitude)}, ${Number(latitude)}), 4326)::geography,
            ${Number(radius)}
          )
        ORDER BY distance_km ASC
        LIMIT ${Number(limit)}
      `;

      res.json({
        success: true,
        data: { professionals },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add service
   */
  addService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const serviceData = req.body;

      const professional = await prisma.professional.findUnique({
        where: { userId },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional profile not found');
      }

      const service = await prisma.service.create({
        data: {
          professionalId: professional.id,
          ...serviceData,
        },
      });

      // Invalidate cache
      await redis.del(`professional:${professional.id}`);

      logger.info('Service added', { professionalId: professional.id, serviceId: service.id });

      res.status(201).json({
        success: true,
        message: 'Service added successfully',
        data: { service },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add portfolio item
   */
  addPortfolioItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const itemData = req.body;

      const professional = await prisma.professional.findUnique({
        where: { userId },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional profile not found');
      }

      const item = await prisma.portfolioItem.create({
        data: {
          professionalId: professional.id,
          ...itemData,
        },
      });

      // Invalidate cache
      await redis.del(`professional:${professional.id}`);

      res.status(201).json({
        success: true,
        message: 'Portfolio item added successfully',
        data: { item },
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async indexProfessional(professional: any): Promise<void> {
    try {
      await meilisearch.index('professionals').addDocuments([
        {
          id: professional.id,
          businessName: professional.businessName,
          businessNameAr: professional.businessNameAr,
          bio: professional.bio,
          bioAr: professional.bioAr,
          categoryId: professional.categoryId,
          wilaya: professional.wilaya,
          commune: professional.commune,
          isVerified: professional.isVerified,
          averageRating: Number(professional.averageRating),
          totalReviews: professional.totalReviews,
          subscriptionTier: professional.subscriptionTier,
          _geo: professional.latitude && professional.longitude ? {
            lat: professional.latitude,
            lng: professional.longitude,
          } : undefined,
        },
      ]);
    } catch (error) {
      logger.error('Failed to index professional', { error, professionalId: professional.id });
    }
  }

  private async incrementViews(professionalId: string, ip?: string, userAgent?: string): Promise<void> {
    // Update total count
    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        totalViews: { increment: 1 },
      },
    });

    // Publish event for detailed analytics
    await kafka.send({
      topic: 'professional.events',
      messages: [{
        key: professionalId,
        value: JSON.stringify({
          eventType: 'PROFESSIONAL_VIEWED',
          eventId: crypto.randomUUID(),
          timestamp: new Date(),
          data: {
            professionalId,
            ip,
            userAgent
          },
        }),
      }],
    });

    // Invalidate cache
    await redis.del(`professional:${professionalId}`);
  }

  private getSortRules(sortBy: string): string[] {
    const sortRules: Record<string, string[]> = {
      relevance: ['_rankingRules'],
      rating: ['averageRating:desc', 'totalReviews:desc'],
      reviews: ['totalReviews:desc', 'averageRating:desc'],
      newest: ['createdAt:desc'],
    };

    return sortRules[sortBy] || sortRules.relevance;
  }
}