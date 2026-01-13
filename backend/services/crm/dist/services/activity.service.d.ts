import { PrismaClient } from '@prisma/client';
import { CreateActivityRequest, UpdateActivityRequest, ActivityResponse, CreateTaskRequest, UpdateTaskRequest, TaskResponse, ActivityFilters, PaginationParams, PaginatedResponse, ServiceContext, ActivityMetrics } from '../types';
export declare class ActivityService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Create a new activity
     */
    create(data: CreateActivityRequest, context: ServiceContext): Promise<ActivityResponse>;
    /**
     * Get activity by ID
     */
    getById(id: string, context: ServiceContext): Promise<ActivityResponse>;
    /**
     * List activities with filters and pagination
     */
    list(filters: ActivityFilters, pagination: PaginationParams, context: ServiceContext): Promise<PaginatedResponse<ActivityResponse>>;
    /**
     * Update activity
     */
    update(id: string, data: UpdateActivityRequest, context: ServiceContext): Promise<ActivityResponse>;
    /**
     * Delete activity (soft delete)
     */
    delete(id: string, context: ServiceContext): Promise<void>;
    /**
     * Get upcoming activities (next 7 days)
     */
    getUpcoming(context: ServiceContext): Promise<ActivityResponse[]>;
    /**
     * Get overdue activities
     */
    getOverdue(context: ServiceContext): Promise<ActivityResponse[]>;
    /**
     * Get activity metrics
     */
    getMetrics(context: ServiceContext): Promise<ActivityMetrics>;
    /**
     * Convert database model to response
     */
    private toActivityResponse;
}
export declare class TaskService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Create a new task
     */
    create(data: CreateTaskRequest, context: ServiceContext): Promise<TaskResponse>;
    /**
     * Get task by ID
     */
    getById(id: string, context: ServiceContext): Promise<TaskResponse>;
    /**
     * List tasks with pagination
     */
    list(status: string | undefined, pagination: PaginationParams, context: ServiceContext): Promise<PaginatedResponse<TaskResponse>>;
    /**
     * Update task
     */
    update(id: string, data: UpdateTaskRequest, context: ServiceContext): Promise<TaskResponse>;
    /**
     * Delete task (soft delete)
     */
    delete(id: string, context: ServiceContext): Promise<void>;
    /**
     * Get overdue tasks
     */
    getOverdue(context: ServiceContext): Promise<TaskResponse[]>;
    /**
     * Convert database model to response
     */
    private toTaskResponse;
}
//# sourceMappingURL=activity.service.d.ts.map