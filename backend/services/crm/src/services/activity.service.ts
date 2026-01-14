import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskResponse,
  ActivityFilters,
  PaginationParams,
  PaginatedResponse,
  ServiceContext,
  NotFoundError,
  ActivityMetrics,
} from '../types';

export class ActivityService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new activity
   */
  async create(
    data: CreateActivityRequest,
    context: ServiceContext
  ): Promise<ActivityResponse> {
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
        throw new NotFoundError('Contact', data.contactId);
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
        throw new NotFoundError('Deal', data.dealId);
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
  async getById(
    id: string,
    context: ServiceContext
  ): Promise<ActivityResponse> {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id,
        professionalId: context.professionalId,
        deletedAt: null,
      },
    });

    if (!activity) {
      throw new NotFoundError('Activity', id);
    }

    return this.toActivityResponse(activity);
  }

  /**
   * List activities with filters and pagination
   */
  async list(
    filters: ActivityFilters,
    pagination: PaginationParams,
    context: ServiceContext
  ): Promise<PaginatedResponse<ActivityResponse>> {
    const { page = 1, limit = 20, sortBy = 'scheduledAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ActivityWhereInput = {
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
  async update(
    id: string,
    data: UpdateActivityRequest,
    context: ServiceContext
  ): Promise<ActivityResponse> {
    // Verify ownership
    await this.getById(id, context);

    // If marking as completed, set completedAt
    const updateData: any = { ...data };
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
  async delete(id: string, context: ServiceContext): Promise<void> {
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
  async getUpcoming(context: ServiceContext): Promise<ActivityResponse[]> {
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
  async getOverdue(context: ServiceContext): Promise<ActivityResponse[]> {
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
  async getMetrics(context: ServiceContext): Promise<ActivityMetrics> {
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
    const completedActivities = activities.filter(
      (a) => a.status === 'COMPLETED'
    ).length;
    const pendingActivities = activities.filter(
      (a) => a.status === 'PENDING'
    ).length;

    // Count by type
    const byType = activities.reduce(
      (acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const completionRate =
      totalActivities > 0
        ? (completedActivities / totalActivities) * 100
        : 0;

    return {
      totalActivities,
      completedActivities,
      pendingActivities,
      byType: byType as any,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }

  /**
   * Convert database model to response
   */
  private toActivityResponse(activity: any): ActivityResponse {
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

// ============================================
// TASK SERVICE
// ============================================

export class TaskService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new task
   */
  async create(
    data: CreateTaskRequest,
    context: ServiceContext
  ): Promise<TaskResponse> {
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
        throw new NotFoundError('Contact', data.contactId);
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
  async getById(id: string, context: ServiceContext): Promise<TaskResponse> {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        professionalId: context.professionalId,
        deletedAt: null,
      },
    });

    if (!task) {
      throw new NotFoundError('Task', id);
    }

    return this.toTaskResponse(task);
  }

  /**
   * List tasks with pagination
   */
  async list(
    status: string | undefined,
    pagination: PaginationParams,
    context: ServiceContext
  ): Promise<PaginatedResponse<TaskResponse>> {
    const { page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      professionalId: context.professionalId,
      deletedAt: null,
      ...(status && { status: status as any }),
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
  async update(
    id: string,
    data: UpdateTaskRequest,
    context: ServiceContext
  ): Promise<TaskResponse> {
    await this.getById(id, context);

    const updateData: any = { ...data };
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
  async delete(id: string, context: ServiceContext): Promise<void> {
    await this.getById(id, context);

    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get overdue tasks
   */
  async getOverdue(context: ServiceContext): Promise<TaskResponse[]> {
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
  private toTaskResponse(task: any): TaskResponse {
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
