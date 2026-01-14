"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = exports.ActivityService = void 0;
const types_1 = require("../types");
class ActivityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create a new activity
     */
    async create(data, context) {
        // Verify contact/deal ownership if provided
        if (data.contactId) {
            const contact = await this.prisma.contact.findFirst({
                where: {
                    id: data.contactId,
                    professionalId: context.professionalId,
                    deletedAt: null,
                },
            });
            if (!contact) {
                throw new types_1.NotFoundError('Contact', data.contactId);
            }
        }
        if (data.dealId) {
            const deal = await this.prisma.deal.findFirst({
                where: {
                    id: data.dealId,
                    professionalId: context.professionalId,
                    deletedAt: null,
                },
            });
            if (!deal) {
                throw new types_1.NotFoundError('Deal', data.dealId);
            }
        }
        const activity = await this.prisma.activity.create({
            data: {
                ...data,
                professionalId: context.professionalId,
            },
        });
        // Update contact's last contact date if activity is with a contact
        if (data.contactId) {
            await this.prisma.contact.update({
                where: { id: data.contactId },
                data: { lastContactDate: new Date() },
            });
        }
        return this.toActivityResponse(activity);
    }
    /**
     * Get activity by ID
     */
    async getById(id, context) {
        const activity = await this.prisma.activity.findFirst({
            where: {
                id,
                professionalId: context.professionalId,
                deletedAt: null,
            },
        });
        if (!activity) {
            throw new types_1.NotFoundError('Activity', id);
        }
        return this.toActivityResponse(activity);
    }
    /**
     * List activities with filters and pagination
     */
    async list(filters, pagination, context) {
        const { page = 1, limit = 20, sortBy = 'scheduledAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;
        // Build where clause
        const where = {
            professionalId: context.professionalId,
            deletedAt: null,
            ...(filters.type && { type: filters.type }),
            ...(filters.status && { status: filters.status }),
            ...(filters.contactId && { contactId: filters.contactId }),
            ...(filters.dealId && { dealId: filters.dealId }),
            ...(filters.fromDate && {
                scheduledAt: { gte: filters.fromDate },
            }),
            ...(filters.toDate && {
                scheduledAt: { lte: filters.toDate },
            }),
        };
        // Execute queries in parallel
        const [activities, total] = await Promise.all([
            this.prisma.activity.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.activity.count({ where }),
        ]);
        return {
            data: activities.map((a) => this.toActivityResponse(a)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Update activity
     */
    async update(id, data, context) {
        // Verify ownership
        await this.getById(id, context);
        // If marking as completed, set completedAt
        const updateData = { ...data };
        if (data.status === 'COMPLETED' && !data.completedAt) {
            updateData.completedAt = new Date();
        }
        const activity = await this.prisma.activity.update({
            where: { id },
            data: updateData,
        });
        return this.toActivityResponse(activity);
    }
    /**
     * Delete activity (soft delete)
     */
    async delete(id, context) {
        // Verify ownership
        await this.getById(id, context);
        await this.prisma.activity.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    /**
     * Get upcoming activities (next 7 days)
     */
    async getUpcoming(context) {
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const activities = await this.prisma.activity.findMany({
            where: {
                professionalId: context.professionalId,
                deletedAt: null,
                status: 'PENDING',
                scheduledAt: {
                    gte: now,
                    lte: nextWeek,
                },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 50,
        });
        return activities.map((a) => this.toActivityResponse(a));
    }
    /**
     * Get overdue activities
     */
    async getOverdue(context) {
        const activities = await this.prisma.activity.findMany({
            where: {
                professionalId: context.professionalId,
                deletedAt: null,
                status: 'PENDING',
                scheduledAt: {
                    lt: new Date(),
                },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 50,
        });
        return activities.map((a) => this.toActivityResponse(a));
    }
    /**
     * Get activity metrics
     */
    async getMetrics(context) {
        const activities = await this.prisma.activity.findMany({
            where: {
                professionalId: context.professionalId,
                deletedAt: null,
            },
            select: {
                type: true,
                status: true,
            },
        });
        const totalActivities = activities.length;
        const completedActivities = activities.filter((a) => a.status === 'COMPLETED').length;
        const pendingActivities = activities.filter((a) => a.status === 'PENDING').length;
        // Count by type
        const byType = activities.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
        }, {});
        const completionRate = totalActivities > 0
            ? (completedActivities / totalActivities) * 100
            : 0;
        return {
            totalActivities,
            completedActivities,
            pendingActivities,
            byType: byType,
            completionRate: Math.round(completionRate * 100) / 100,
        };
    }
    /**
     * Convert database model to response
     */
    toActivityResponse(activity) {
        return {
            id: activity.id,
            contactId: activity.contactId,
            dealId: activity.dealId,
            type: activity.type,
            subject: activity.subject,
            status: activity.status,
            priority: activity.priority,
            scheduledAt: activity.scheduledAt,
            completedAt: activity.completedAt,
            duration: activity.duration,
            outcome: activity.outcome,
            createdAt: activity.createdAt,
        };
    }
}
exports.ActivityService = ActivityService;
// ============================================
// TASK SERVICE
// ============================================
class TaskService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create a new task
     */
    async create(data, context) {
        // Verify contact ownership if provided
        if (data.contactId) {
            const contact = await this.prisma.contact.findFirst({
                where: {
                    id: data.contactId,
                    professionalId: context.professionalId,
                    deletedAt: null,
                },
            });
            if (!contact) {
                throw new types_1.NotFoundError('Contact', data.contactId);
            }
        }
        const task = await this.prisma.task.create({
            data: {
                ...data,
                professionalId: context.professionalId,
            },
        });
        return this.toTaskResponse(task);
    }
    /**
     * Get task by ID
     */
    async getById(id, context) {
        const task = await this.prisma.task.findFirst({
            where: {
                id,
                professionalId: context.professionalId,
                deletedAt: null,
            },
        });
        if (!task) {
            throw new types_1.NotFoundError('Task', id);
        }
        return this.toTaskResponse(task);
    }
    /**
     * List tasks with pagination
     */
    async list(status, pagination, context) {
        const { page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;
        const where = {
            professionalId: context.professionalId,
            deletedAt: null,
            ...(status && { status: status }),
        };
        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.task.count({ where }),
        ]);
        return {
            data: tasks.map((t) => this.toTaskResponse(t)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Update task
     */
    async update(id, data, context) {
        await this.getById(id, context);
        const updateData = { ...data };
        if (data.status === 'COMPLETED' && !data.completedAt) {
            updateData.completedAt = new Date();
        }
        const task = await this.prisma.task.update({
            where: { id },
            data: updateData,
        });
        return this.toTaskResponse(task);
    }
    /**
     * Delete task (soft delete)
     */
    async delete(id, context) {
        await this.getById(id, context);
        await this.prisma.task.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    /**
     * Get overdue tasks
     */
    async getOverdue(context) {
        const tasks = await this.prisma.task.findMany({
            where: {
                professionalId: context.professionalId,
                deletedAt: null,
                status: 'PENDING',
                dueDate: {
                    lt: new Date(),
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        return tasks.map((t) => this.toTaskResponse(t));
    }
    /**
     * Convert database model to response
     */
    toTaskResponse(task) {
        return {
            id: task.id,
            contactId: task.contactId,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            completedAt: task.completedAt,
            createdAt: task.createdAt,
        };
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=activity.service.js.map