import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from './lib/prisma';
import { ContactService } from './services/contact.service';
import { authenticate } from './middleware/authenticate';
import { DealService } from './services/deal.service';
import { ActivityService, TaskService } from './services/activity.service';
import {
  createContactSchema,
  updateContactSchema,
  contactFiltersSchema,
  createDealSchema,
  updateDealSchema,
  dealFiltersSchema,
  createActivitySchema,
  updateActivitySchema,
  activityFiltersSchema,
  createTaskSchema,
  updateTaskSchema,
  paginationSchema,
} from './validation';
import { ServiceContext } from './types';

const router = Router();

// Services
const contactService = new ContactService(prisma);
const dealService = new DealService(prisma);
const activityService = new ActivityService(prisma);
const taskService = new TaskService(prisma);

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Extract service context from authenticated request
 * In production, this would validate JWT and extract user info
 */
function getServiceContext(req: Request): ServiceContext {
  return {
    professionalId: req.headers['x-professional-id'] as string || 'prof-123',
    userId: req.user?.userId || 'user-123',
  };
}

/**
 * Async error handler wrapper
 */
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// CONTACTS ENDPOINTS
// ============================================

/**
 * POST /contacts - Create new contact
 */
router.post(
  '/contacts',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const data = createContactSchema.parse(req.body);
    const context = getServiceContext(req);
    const contact = await contactService.create(data, context);
    res.status(201).json(contact);
  })
);

/**
 * GET /contacts - List contacts with filters
 */
router.get(
  '/contacts',
  asyncHandler(async (req: Request, res: Response) => {
    const filters = contactFiltersSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);
    const context = getServiceContext(req);
    const result = await contactService.list(filters, pagination, context);
    res.json(result);
  })
);

/**
 * GET /contacts/:id - Get contact by ID
 */
router.get(
  '/contacts/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const contact = await contactService.getById(req.params.id, context);
    res.json(contact);
  })
);

/**
 * PUT /contacts/:id - Update contact
 */
router.put(
  '/contacts/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateContactSchema.parse(req.body);
    const context = getServiceContext(req);
    const contact = await contactService.update(req.params.id, data, context);
    res.json(contact);
  })
);

/**
 * DELETE /contacts/:id - Delete contact (soft delete)
 */
router.delete(
  '/contacts/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    await contactService.delete(req.params.id, context);
    res.status(204).send();
  })
);

/**
 * GET /contacts/follow-up - Get contacts requiring follow-up
 */
router.get(
  '/contacts/follow-up',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const contacts = await contactService.getFollowUpContacts(context);
    res.json(contacts);
  })
);

/**
 * GET /contacts/metrics - Get contact metrics
 */
router.get(
  '/contacts/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const metrics = await contactService.getMetrics(context);
    res.json(metrics);
  })
);

// ============================================
// DEALS ENDPOINTS
// ============================================

/**
 * POST /deals - Create new deal
 */
router.post(
  '/deals',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createDealSchema.parse(req.body);
    const context = getServiceContext(req);
    const deal = await dealService.create(data, context);
    res.status(201).json(deal);
  })
);

/**
 * GET /deals - List deals with filters
 */
router.get(
  '/deals',
  asyncHandler(async (req: Request, res: Response) => {
    const filters = dealFiltersSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);
    const context = getServiceContext(req);
    const result = await dealService.list(filters, pagination, context);
    res.json(result);
  })
);

/**
 * GET /deals/:id - Get deal by ID
 */
router.get(
  '/deals/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const deal = await dealService.getById(req.params.id, context);
    res.json(deal);
  })
);

/**
 * PUT /deals/:id - Update deal
 */
router.put(
  '/deals/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateDealSchema.parse(req.body);
    const context = getServiceContext(req);
    const deal = await dealService.update(req.params.id, data, context);
    res.json(deal);
  })
);

/**
 * DELETE /deals/:id - Delete deal (soft delete)
 */
router.delete(
  '/deals/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    await dealService.delete(req.params.id, context);
    res.status(204).send();
  })
);

/**
 * POST /deals/:id/advance - Move deal to next stage
 */
router.post(
  '/deals/:id/advance',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const deal = await dealService.moveToNextStage(req.params.id, context);
    res.json(deal);
  })
);

/**
 * GET /deals/pipeline/metrics - Get pipeline metrics
 */
router.get(
  '/deals/pipeline/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const metrics = await dealService.getPipelineMetrics(context);
    res.json(metrics);
  })
);

// ============================================
// ACTIVITIES ENDPOINTS
// ============================================

/**
 * POST /activities - Create new activity
 */
router.post(
  '/activities',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createActivitySchema.parse(req.body);
    const context = getServiceContext(req);
    const activity = await activityService.create(data, context);
    res.status(201).json(activity);
  })
);

/**
 * GET /activities - List activities with filters
 */
router.get(
  '/activities',
  asyncHandler(async (req: Request, res: Response) => {
    const filters = activityFiltersSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);
    const context = getServiceContext(req);
    const result = await activityService.list(filters, pagination, context);
    res.json(result);
  })
);

/**
 * GET /activities/:id - Get activity by ID
 */
router.get(
  '/activities/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const activity = await activityService.getById(req.params.id, context);
    res.json(activity);
  })
);

/**
 * PUT /activities/:id - Update activity
 */
router.put(
  '/activities/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateActivitySchema.parse(req.body);
    const context = getServiceContext(req);
    const activity = await activityService.update(req.params.id, data, context);
    res.json(activity);
  })
);

/**
 * DELETE /activities/:id - Delete activity
 */
router.delete(
  '/activities/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    await activityService.delete(req.params.id, context);
    res.status(204).send();
  })
);

/**
 * GET /activities/upcoming - Get upcoming activities
 */
router.get(
  '/activities/upcoming',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const activities = await activityService.getUpcoming(context);
    res.json(activities);
  })
);

/**
 * GET /activities/overdue - Get overdue activities
 */
router.get(
  '/activities/overdue',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const activities = await activityService.getOverdue(context);
    res.json(activities);
  })
);

/**
 * GET /activities/metrics - Get activity metrics
 */
router.get(
  '/activities/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const metrics = await activityService.getMetrics(context);
    res.json(metrics);
  })
);

// ============================================
// TASKS ENDPOINTS
// ============================================

/**
 * POST /tasks - Create new task
 */
router.post(
  '/tasks',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createTaskSchema.parse(req.body);
    const context = getServiceContext(req);
    const task = await taskService.create(data, context);
    res.status(201).json(task);
  })
);

/**
 * GET /tasks - List tasks
 */
router.get(
  '/tasks',
  asyncHandler(async (req: Request, res: Response) => {
    const pagination = paginationSchema.parse(req.query);
    const context = getServiceContext(req);
    const result = await taskService.list(
      req.query.status as string,
      pagination,
      context
    );
    res.json(result);
  })
);

/**
 * GET /tasks/:id - Get task by ID
 */
router.get(
  '/tasks/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const task = await taskService.getById(req.params.id, context);
    res.json(task);
  })
);

/**
 * PUT /tasks/:id - Update task
 */
router.put(
  '/tasks/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateTaskSchema.parse(req.body);
    const context = getServiceContext(req);
    const task = await taskService.update(req.params.id, data, context);
    res.json(task);
  })
);

/**
 * DELETE /tasks/:id - Delete task
 */
router.delete(
  '/tasks/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    await taskService.delete(req.params.id, context);
    res.status(204).send();
  })
);

/**
 * GET /tasks/overdue - Get overdue tasks
 */
router.get(
  '/tasks/overdue',
  asyncHandler(async (req: Request, res: Response) => {
    const context = getServiceContext(req);
    const tasks = await taskService.getOverdue(context);
    res.json(tasks);
  })
);

// ============================================
// HEALTH CHECK
// ============================================

/**
 * GET /health - Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'crm-service',
    timestamp: new Date().toISOString(),
  });
});

export default router;
