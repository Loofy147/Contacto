"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.activityFiltersSchema = exports.updateActivitySchema = exports.createActivitySchema = exports.dealFiltersSchema = exports.updateDealSchema = exports.createDealSchema = exports.contactFiltersSchema = exports.updateContactSchema = exports.createContactSchema = void 0;
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// ============================================
// CONTACT SCHEMAS
// ============================================
exports.createContactSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z
        .string()
        .regex(/^(00213|0)(5|6|7)[0-9]{8}$/, 'Invalid Algerian phone number')
        .optional()
        .or(zod_1.z.literal('')),
    alternatePhone: zod_1.z
        .string()
        .regex(/^(00213|0)(5|6|7)[0-9]{8}$/, 'Invalid Algerian phone number')
        .optional()
        .or(zod_1.z.literal('')),
    company: zod_1.z.string().max(200).optional(),
    jobTitle: zod_1.z.string().max(100).optional(),
    industry: zod_1.z.string().max(100).optional(),
    type: zod_1.z.nativeEnum(client_1.ContactType).optional(),
    source: zod_1.z.nativeEnum(client_1.LeadSource).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    address: zod_1.z.string().optional(),
    wilaya: zod_1.z.string().max(50).optional(),
    commune: zod_1.z.string().max(100).optional(),
    website: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    linkedinUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    facebookUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    notes: zod_1.z.string().optional(),
    customFields: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.updateContactSchema = exports.createContactSchema
    .partial()
    .extend({
    status: zod_1.z.nativeEnum(client_1.ContactStatus).optional(),
    leadScore: zod_1.z.number().int().min(0).max(100).optional(),
    nextFollowUpDate: zod_1.z.coerce.date().optional(),
});
exports.contactFiltersSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.ContactType).optional(),
    status: zod_1.z.nativeEnum(client_1.ContactStatus).optional(),
    source: zod_1.z.nativeEnum(client_1.LeadSource).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    wilaya: zod_1.z.string().optional(),
    minLeadScore: zod_1.z.coerce.number().int().min(0).max(100).optional(),
    maxLeadScore: zod_1.z.coerce.number().int().min(0).max(100).optional(),
    search: zod_1.z.string().optional(),
});
// ============================================
// DEAL SCHEMAS
// ============================================
exports.createDealSchema = zod_1.z.object({
    contactId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive(),
    probability: zod_1.z.number().int().min(0).max(100).optional(),
    stage: zod_1.z.nativeEnum(client_1.DealStage).optional(),
    priority: zod_1.z.nativeEnum(client_1.Priority).optional(),
    expectedCloseDate: zod_1.z.coerce.date().optional(),
    customFields: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.updateDealSchema = exports.createDealSchema
    .partial()
    .extend({
    lostReason: zod_1.z.string().optional(),
    winReason: zod_1.z.string().optional(),
    actualCloseDate: zod_1.z.coerce.date().optional(),
});
exports.dealFiltersSchema = zod_1.z.object({
    stage: zod_1.z.nativeEnum(client_1.DealStage).optional(),
    priority: zod_1.z.nativeEnum(client_1.Priority).optional(),
    minAmount: zod_1.z.coerce.number().positive().optional(),
    maxAmount: zod_1.z.coerce.number().positive().optional(),
    contactId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
});
// ============================================
// ACTIVITY SCHEMAS
// ============================================
exports.createActivitySchema = zod_1.z.object({
    contactId: zod_1.z.string().uuid().optional(),
    dealId: zod_1.z.string().uuid().optional(),
    type: zod_1.z.nativeEnum(client_1.ActivityType),
    subject: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.nativeEnum(client_1.Priority).optional(),
    scheduledAt: zod_1.z.coerce.date().optional(),
    duration: zod_1.z.number().int().positive().optional(), // minutes
});
exports.updateActivitySchema = exports.createActivitySchema
    .partial()
    .extend({
    status: zod_1.z.nativeEnum(client_1.ActivityStatus).optional(),
    completedAt: zod_1.z.coerce.date().optional(),
    outcome: zod_1.z.string().optional(),
});
exports.activityFiltersSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.ActivityType).optional(),
    status: zod_1.z.nativeEnum(client_1.ActivityStatus).optional(),
    contactId: zod_1.z.string().uuid().optional(),
    dealId: zod_1.z.string().uuid().optional(),
    fromDate: zod_1.z.coerce.date().optional(),
    toDate: zod_1.z.coerce.date().optional(),
});
// ============================================
// TASK SCHEMAS
// ============================================
exports.createTaskSchema = zod_1.z.object({
    contactId: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.nativeEnum(client_1.Priority).optional(),
    dueDate: zod_1.z.coerce.date().optional(),
    assignedTo: zod_1.z.string().uuid().optional(),
});
exports.updateTaskSchema = exports.createTaskSchema
    .partial()
    .extend({
    status: zod_1.z.nativeEnum(client_1.ActivityStatus).optional(),
    completedAt: zod_1.z.coerce.date().optional(),
});
// ============================================
// PAGINATION SCHEMA
// ============================================
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
// ============================================
// HELPER FUNCTIONS
// ============================================
function validateRequest(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }));
        throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }
    return result.data;
}
//# sourceMappingURL=validation.js.map