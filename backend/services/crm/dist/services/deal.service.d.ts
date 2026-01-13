import { PrismaClient } from '@prisma/client';
import { CreateDealRequest, UpdateDealRequest, DealResponse, DealFilters, PaginationParams, PaginatedResponse, ServiceContext, PipelineMetrics } from '../types';
export declare class DealService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Create a new deal
     */
    create(data: CreateDealRequest, context: ServiceContext): Promise<DealResponse>;
    /**
     * Get deal by ID
     */
    getById(id: string, context: ServiceContext): Promise<DealResponse>;
    /**
     * List deals with filters and pagination
     */
    list(filters: DealFilters, pagination: PaginationParams, context: ServiceContext): Promise<PaginatedResponse<DealResponse>>;
    /**
     * Update deal
     */
    update(id: string, data: UpdateDealRequest, context: ServiceContext): Promise<DealResponse>;
    /**
     * Delete deal (soft delete)
     */
    delete(id: string, context: ServiceContext): Promise<void>;
    /**
     * Move deal to next stage
     */
    moveToNextStage(id: string, context: ServiceContext): Promise<DealResponse>;
    /**
     * Get pipeline metrics
     */
    getPipelineMetrics(context: ServiceContext): Promise<PipelineMetrics>;
    /**
     * Update contact metrics when deals change
     */
    private updateContactMetrics;
    /**
     * Convert database model to response
     */
    private toResponse;
}
//# sourceMappingURL=deal.service.d.ts.map