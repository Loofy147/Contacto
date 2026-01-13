import { PrismaClient, Prisma, DealStage } from '@prisma/client';
import {
  CreateDealRequest,
  UpdateDealRequest,
  DealResponse,
  DealFilters,
  PaginationParams,
  PaginatedResponse,
  ServiceContext,
  NotFoundError,
  PipelineMetrics,
} from '../types';

export class DealService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new deal
   */
  async create(
    data: CreateDealRequest,
    context: ServiceContext
  ): Promise<DealResponse> {
    // Verify contact exists and belongs to professional
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: data.contactId,
        professionalId: context.professionalId,
        deletedAt: null,
      },
    });

    if (!contact) {
      throw new NotFoundError('Contact', data.contactId);
    }

    // Calculate expected revenue
    const probability = data.probability ?? 50;
    const expectedRevenue = data.amount * (probability / 100);

    const deal = await this.prisma.deal.create({
      data: {
        ...data,
        professionalId: context.professionalId,
        probability,
        expectedRevenue,
      },
    });

    // Update contact metrics
    await this.updateContactMetrics(data.contactId);

    return this.toResponse(deal);
  }

  /**
   * Get deal by ID
   */
  async getById(id: string, context: ServiceContext): Promise<DealResponse> {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        professionalId: context.professionalId,
        deletedAt: null,
      },
    });

    if (!deal) {
      throw new NotFoundError('Deal', id);
    }

    return this.toResponse(deal);
  }

  /**
   * List deals with filters and pagination
   */
  async list(
    filters: DealFilters,
    pagination: PaginationParams,
    context: ServiceContext
  ): Promise<PaginatedResponse<DealResponse>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.DealWhereInput = {
      professionalId: context.professionalId,
      deletedAt: null,
      ...(filters.stage && { stage: filters.stage }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.contactId && { contactId: filters.contactId }),
      ...(filters.minAmount !== undefined && {
        amount: { gte: filters.minAmount },
      }),
      ...(filters.maxAmount !== undefined && {
        amount: { lte: filters.maxAmount },
      }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Execute queries in parallel
    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      data: deals.map((d) => this.toResponse(d)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update deal
   */
  async update(
    id: string,
    data: UpdateDealRequest,
    context: ServiceContext
  ): Promise<DealResponse> {
    // Verify ownership
    const existingDeal = await this.getById(id, context);

    // Recalculate expected revenue if amount or probability changed
    const updateData: any = { ...data };
    if (data.amount !== undefined || data.probability !== undefined) {
      const amount = data.amount ?? existingDeal.amount;
      const probability = data.probability ?? existingDeal.probability;
      updateData.expectedRevenue = amount * (probability / 100);
    }

    // If stage changed to CLOSED_WON or CLOSED_LOST, set actual close date
    if (
      data.stage &&
      (data.stage === 'CLOSED_WON' || data.stage === 'CLOSED_LOST') &&
      !data.actualCloseDate
    ) {
      updateData.actualCloseDate = new Date();
    }

    const deal = await this.prisma.deal.update({
      where: { id },
      data: updateData,
    });

    // Update contact metrics
    await this.updateContactMetrics(deal.contactId);

    return this.toResponse(deal);
  }

  /**
   * Delete deal (soft delete)
   */
  async delete(id: string, context: ServiceContext): Promise<void> {
    // Verify ownership
    const deal = await this.getById(id, context);

    await this.prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Update contact metrics
    await this.updateContactMetrics(deal.contactId);
  }

  /**
   * Move deal to next stage
   */
  async moveToNextStage(
    id: string,
    context: ServiceContext
  ): Promise<DealResponse> {
    const deal = await this.getById(id, context);

    const stageFlow: Record<DealStage, DealStage> = {
      PROSPECTING: 'QUALIFICATION',
      QUALIFICATION: 'PROPOSAL',
      PROPOSAL: 'NEGOTIATION',
      NEGOTIATION: 'CLOSED_WON', // Default to won, user can change
      CLOSED_WON: 'CLOSED_WON',
      CLOSED_LOST: 'CLOSED_LOST',
    };

    const nextStage = stageFlow[deal.stage as DealStage];

    return this.update(id, { stage: nextStage }, context);
  }

  /**
   * Get pipeline metrics
   */
  async getPipelineMetrics(
    context: ServiceContext
  ): Promise<PipelineMetrics> {
    const deals = await this.prisma.deal.findMany({
      where: {
        professionalId: context.professionalId,
        deletedAt: null,
      },
      select: {
        stage: true,
        amount: true,
        createdAt: true,
        actualCloseDate: true,
      },
    });

    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, d) => sum + Number(d.amount), 0);
    const averageDealSize = totalValue / totalDeals || 0;

    // Calculate win rate
    const closedDeals = deals.filter(
      (d) => d.stage === 'CLOSED_WON' || d.stage === 'CLOSED_LOST'
    );
    const wonDeals = deals.filter((d) => d.stage === 'CLOSED_WON');
    const winRate = closedDeals.length > 0
      ? (wonDeals.length / closedDeals.length) * 100
      : 0;

    // Calculate average sales cycle (days from creation to close)
    const closedWithDates = deals.filter(
      (d) => d.actualCloseDate && (d.stage === 'CLOSED_WON' || d.stage === 'CLOSED_LOST')
    );
    const averageSalesCycle =
      closedWithDates.length > 0
        ? closedWithDates.reduce((sum, d) => {
            const days = Math.floor(
              (d.actualCloseDate!.getTime() - d.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }, 0) / closedWithDates.length
        : 0;

    // Group by stage
    const byStage = deals.reduce(
      (acc, d) => {
        const existing = acc.find((item) => item.stage === d.stage);
        if (existing) {
          existing.count++;
          existing.value += Number(d.amount);
        } else {
          acc.push({
            stage: d.stage as DealStage,
            count: 1,
            value: Number(d.amount),
          });
        }
        return acc;
      },
      [] as Array<{ stage: DealStage; count: number; value: number }>
    );

    return {
      totalDeals,
      totalValue,
      averageDealSize,
      winRate: Math.round(winRate * 100) / 100,
      averageSalesCycle: Math.round(averageSalesCycle),
      byStage,
    };
  }

  /**
   * Update contact metrics when deals change
   */
  private async updateContactMetrics(contactId: string): Promise<void> {
    const deals = await this.prisma.deal.findMany({
      where: {
        contactId,
        deletedAt: null,
        stage: 'CLOSED_WON',
      },
      select: {
        amount: true,
      },
    });

    const totalDeals = deals.length;
    const totalRevenue = deals.reduce((sum, d) => sum + Number(d.amount), 0);
    const lifetimeValue = totalRevenue;

    await this.prisma.contact.update({
      where: { id: contactId },
      data: {
        totalDeals,
        totalRevenue,
        lifetimeValue,
      },
    });
  }

  /**
   * Convert database model to response
   */
  private toResponse(deal: any): DealResponse {
    return {
      id: deal.id,
      contactId: deal.contactId,
      title: deal.title,
      amount: Number(deal.amount),
      currency: deal.currency,
      probability: deal.probability,
      expectedRevenue: Number(deal.expectedRevenue),
      stage: deal.stage,
      priority: deal.priority,
      expectedCloseDate: deal.expectedCloseDate,
      actualCloseDate: deal.actualCloseDate,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
  }
}
