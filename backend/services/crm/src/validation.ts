import { z } from 'zod';
import {
  ContactType,
  ContactStatus,
  LeadSource,
  DealStage,
  ActivityType,
  ActivityStatus,
  Priority,
} from '@prisma/client';

// ============================================
// CONTACT SCHEMAS
// ============================================

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^(00213|0)(5|6|7)[0-9]{8}$/, 'Invalid Algerian phone number')
    .optional()
    .or(z.literal('')),
  alternatePhone: z
    .string()
    .regex(/^(00213|0)(5|6|7)[0-9]{8}$/, 'Invalid Algerian phone number')
    .optional()
    .or(z.literal('')),
  company: z.string().max(200).optional(),
  jobTitle: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  type: z.nativeEnum(ContactType).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  tags: z.array(z.string()).optional(),
  address: z.string().optional(),
  wilaya: z.string().max(50).optional(),
  commune: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  customFields: z.record(z.any()).optional(),
});

export const updateContactSchema = createContactSchema
  .partial()
  .extend({
    status: z.nativeEnum(ContactStatus).optional(),
    leadScore: z.number().int().min(0).max(100).optional(),
    nextFollowUpDate: z.coerce.date().optional(),
  });

export const contactFiltersSchema = z.object({
  type: z.nativeEnum(ContactType).optional(),
  status: z.nativeEnum(ContactStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  tags: z.array(z.string()).optional(),
  wilaya: z.string().optional(),
  minLeadScore: z.coerce.number().int().min(0).max(100).optional(),
  maxLeadScore: z.coerce.number().int().min(0).max(100).optional(),
  search: z.string().optional(),
});

// ============================================
// DEAL SCHEMAS
// ============================================

export const createDealSchema = z.object({
  contactId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  amount: z.number().positive(),
  probability: z.number().int().min(0).max(100).optional(),
  stage: z.nativeEnum(DealStage).optional(),
  priority: z.nativeEnum(Priority).optional(),
  expectedCloseDate: z.coerce.date().optional(),
  customFields: z.record(z.any()).optional(),
});

export const updateDealSchema = createDealSchema
  .partial()
  .extend({
    lostReason: z.string().optional(),
    winReason: z.string().optional(),
    actualCloseDate: z.coerce.date().optional(),
  });

export const dealFiltersSchema = z.object({
  stage: z.nativeEnum(DealStage).optional(),
  priority: z.nativeEnum(Priority).optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  contactId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// ============================================
// ACTIVITY SCHEMAS
// ============================================

export const createActivitySchema = z.object({
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  type: z.nativeEnum(ActivityType),
  subject: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  scheduledAt: z.coerce.date().optional(),
  duration: z.number().int().positive().optional(), // minutes
});

export const updateActivitySchema = createActivitySchema
  .partial()
  .extend({
    status: z.nativeEnum(ActivityStatus).optional(),
    completedAt: z.coerce.date().optional(),
    outcome: z.string().optional(),
  });

export const activityFiltersSchema = z.object({
  type: z.nativeEnum(ActivityType).optional(),
  status: z.nativeEnum(ActivityStatus).optional(),
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

// ============================================
// TASK SCHEMAS
// ============================================

export const createTaskSchema = z.object({
  contactId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.coerce.date().optional(),
  assignedTo: z.string().uuid().optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .extend({
    status: z.nativeEnum(ActivityStatus).optional(),
    completedAt: z.coerce.date().optional(),
  });

// ============================================
// PAGINATION SCHEMA
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    throw new Error(
      `Validation failed: ${JSON.stringify(errors)}`
    );
  }

  return result.data;
}

// Type exports for inference
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactFiltersInput = z.infer<typeof contactFiltersSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type DealFiltersInput = z.infer<typeof dealFiltersSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ActivityFiltersInput = z.infer<typeof activityFiltersSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
