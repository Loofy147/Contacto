import { PrismaClient } from '@prisma/client';
import { CreateContactRequest, UpdateContactRequest, ContactResponse, ContactFilters, PaginationParams, PaginatedResponse, ServiceContext, ContactMetrics } from '../types';
export declare class ContactService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Create a new contact
     */
    create(data: CreateContactRequest, context: ServiceContext): Promise<ContactResponse>;
    /**
     * Get contact by ID
     */
    getById(id: string, context: ServiceContext): Promise<ContactResponse>;
    /**
     * List contacts with filters and pagination
     */
    list(filters: ContactFilters, pagination: PaginationParams, context: ServiceContext): Promise<PaginatedResponse<ContactResponse>>;
    /**
     * Update contact
     */
    update(id: string, data: UpdateContactRequest, context: ServiceContext): Promise<ContactResponse>;
    /**
     * Delete contact (soft delete)
     */
    delete(id: string, context: ServiceContext): Promise<void>;
    /**
     * Update lead score (for automated scoring)
     */
    updateLeadScore(id: string, score: number, context: ServiceContext): Promise<ContactResponse>;
    /**
     * Get contacts requiring follow-up
     */
    getFollowUpContacts(context: ServiceContext): Promise<ContactResponse[]>;
    /**
     * Get contact metrics
     */
    getMetrics(context: ServiceContext): Promise<ContactMetrics>;
    /**
     * Convert database model to response
     */
    private toResponse;
}
//# sourceMappingURL=contact.service.d.ts.map