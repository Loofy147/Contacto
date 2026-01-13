"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const types_1 = require("../types");
class ContactService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create a new contact
     */
    async create(data, context) {
        // Compute full name
        const fullName = `${data.firstName} ${data.lastName}`.trim();
        // Check for duplicate email or phone
        if (data.email || data.phone) {
            const existing = await this.prisma.contact.findFirst({
                where: {
                    professionalId: context.professionalId,
                    OR: [
                        data.email ? { email: data.email } : {},
                        data.phone ? { phone: data.phone } : {},
                    ],
                    deletedAt: null,
                },
            });
            if (existing) {
                throw new types_1.ValidationError('A contact with this email or phone already exists');
            }
        }
        const contact = await this.prisma.contact.create({
            data: {
                ...data,
                fullName,
                professionalId: context.professionalId,
            },
        });
        return this.toResponse(contact);
    }
    /**
     * Get contact by ID
     */
    async getById(id, context) {
        const contact = await this.prisma.contact.findFirst({
            where: {
                id,
                professionalId: context.professionalId,
                deletedAt: null,
            },
        });
        if (!contact) {
            throw new types_1.NotFoundError('Contact', id);
        }
        return this.toResponse(contact);
    }
    /**
     * List contacts with filters and pagination
     */
    async list(filters, pagination, context) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;
        // Build where clause
        const where = {
            professionalId: context.professionalId,
            deletedAt: null,
            ...(filters.type && { type: filters.type }),
            ...(filters.status && { status: filters.status }),
            ...(filters.source && { source: filters.source }),
            ...(filters.wilaya && { wilaya: filters.wilaya }),
            ...(filters.tags &&
                filters.tags.length > 0 && {
                tags: { hasSome: filters.tags },
            }),
            ...(filters.minLeadScore !== undefined && {
                leadScore: { gte: filters.minLeadScore },
            }),
            ...(filters.maxLeadScore !== undefined && {
                leadScore: { lte: filters.maxLeadScore },
            }),
            ...(filters.search && {
                OR: [
                    { fullName: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } },
                    { phone: { contains: filters.search } },
                    { company: { contains: filters.search, mode: 'insensitive' } },
                ],
            }),
        };
        // Execute queries in parallel
        const [contacts, total] = await Promise.all([
            this.prisma.contact.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.contact.count({ where }),
        ]);
        return {
            data: contacts.map((c) => this.toResponse(c)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Update contact
     */
    async update(id, data, context) {
        // Verify ownership
        await this.getById(id, context);
        // Update full name if firstName or lastName changed
        const updateData = { ...data };
        if (data.firstName || data.lastName) {
            const current = await this.prisma.contact.findUnique({
                where: { id },
                select: { firstName: true, lastName: true },
            });
            const firstName = data.firstName || current.firstName;
            const lastName = data.lastName || current.lastName;
            updateData.fullName = `${firstName} ${lastName}`.trim();
        }
        const contact = await this.prisma.contact.update({
            where: { id },
            data: updateData,
        });
        return this.toResponse(contact);
    }
    /**
     * Delete contact (soft delete)
     */
    async delete(id, context) {
        // Verify ownership
        await this.getById(id, context);
        await this.prisma.contact.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    /**
     * Update lead score (for automated scoring)
     */
    async updateLeadScore(id, score, context) {
        // Verify ownership
        await this.getById(id, context);
        const contact = await this.prisma.contact.update({
            where: { id },
            data: { leadScore: Math.max(0, Math.min(100, score)) },
        });
        return this.toResponse(contact);
    }
    /**
     * Get contacts requiring follow-up
     */
    async getFollowUpContacts(context) {
        const contacts = await this.prisma.contact.findMany({
            where: {
                professionalId: context.professionalId,
                deletedAt: null,
                nextFollowUpDate: {
                    lte: new Date(),
                },
                status: 'ACTIVE',
            },
            orderBy: { nextFollowUpDate: 'asc' },
            take: 50,
        });
        return contacts.map((c) => this.toResponse(c));
    }
    /**
     * Get contact metrics
     */
    async getMetrics(context) {
        const contacts = await this.prisma.contact.findMany({
            where: {
                professionalId: context.professionalId,
                deletedAt: null,
            },
            select: {
                type: true,
                source: true,
                leadScore: true,
                totalDeals: true,
            },
        });
        const totalContacts = contacts.length;
        // Count by type
        const byType = contacts.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1;
            return acc;
        }, {});
        // Count by source
        const bySource = contacts.reduce((acc, c) => {
            if (c.source) {
                acc[c.source] = (acc[c.source] || 0) + 1;
            }
            return acc;
        }, {});
        // Calculate average lead score
        const averageLeadScore = contacts.reduce((sum, c) => sum + c.leadScore, 0) / totalContacts || 0;
        // Calculate conversion rate (contacts with deals / total contacts)
        const contactsWithDeals = contacts.filter((c) => c.totalDeals > 0).length;
        const conversionRate = (contactsWithDeals / totalContacts) * 100 || 0;
        return {
            totalContacts,
            byType: byType,
            bySource: bySource,
            averageLeadScore: Math.round(averageLeadScore),
            conversionRate: Math.round(conversionRate * 100) / 100,
        };
    }
    /**
     * Convert database model to response
     */
    toResponse(contact) {
        return {
            id: contact.id,
            fullName: contact.fullName,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            jobTitle: contact.jobTitle,
            type: contact.type,
            status: contact.status,
            source: contact.source,
            tags: contact.tags,
            leadScore: contact.leadScore,
            lifetimeValue: Number(contact.lifetimeValue),
            totalDeals: contact.totalDeals,
            totalRevenue: Number(contact.totalRevenue),
            lastContactDate: contact.lastContactDate,
            nextFollowUpDate: contact.nextFollowUpDate,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
        };
    }
}
exports.ContactService = ContactService;
//# sourceMappingURL=contact.service.js.map