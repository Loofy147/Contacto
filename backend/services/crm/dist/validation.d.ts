import { z } from 'zod';
export declare const createContactSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    alternatePhone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    company: z.ZodOptional<z.ZodString>;
    jobTitle: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<{
        LEAD: "LEAD";
        CUSTOMER: "CUSTOMER";
        PARTNER: "PARTNER";
        VENDOR: "VENDOR";
    }>>;
    source: z.ZodOptional<z.ZodNativeEnum<{
        WEBSITE: "WEBSITE";
        REFERRAL: "REFERRAL";
        DIRECTORY: "DIRECTORY";
        SOCIAL_MEDIA: "SOCIAL_MEDIA";
        PAID_ADS: "PAID_ADS";
        EVENT: "EVENT";
        COLD_CALL: "COLD_CALL";
        OTHER: "OTHER";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    address: z.ZodOptional<z.ZodString>;
    wilaya: z.ZodOptional<z.ZodString>;
    commune: z.ZodOptional<z.ZodString>;
    website: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    linkedinUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    facebookUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    notes: z.ZodOptional<z.ZodString>;
    customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email?: string | undefined;
    phone?: string | undefined;
    alternatePhone?: string | undefined;
    company?: string | undefined;
    jobTitle?: string | undefined;
    industry?: string | undefined;
    type?: "LEAD" | "CUSTOMER" | "PARTNER" | "VENDOR" | undefined;
    source?: "WEBSITE" | "REFERRAL" | "DIRECTORY" | "SOCIAL_MEDIA" | "PAID_ADS" | "EVENT" | "COLD_CALL" | "OTHER" | undefined;
    tags?: string[] | undefined;
    address?: string | undefined;
    wilaya?: string | undefined;
    commune?: string | undefined;
    website?: string | undefined;
    linkedinUrl?: string | undefined;
    facebookUrl?: string | undefined;
    notes?: string | undefined;
    customFields?: Record<string, any> | undefined;
}, {
    firstName: string;
    lastName: string;
    email?: string | undefined;
    phone?: string | undefined;
    alternatePhone?: string | undefined;
    company?: string | undefined;
    jobTitle?: string | undefined;
    industry?: string | undefined;
    type?: "LEAD" | "CUSTOMER" | "PARTNER" | "VENDOR" | undefined;
    source?: "WEBSITE" | "REFERRAL" | "DIRECTORY" | "SOCIAL_MEDIA" | "PAID_ADS" | "EVENT" | "COLD_CALL" | "OTHER" | undefined;
    tags?: string[] | undefined;
    address?: string | undefined;
    wilaya?: string | undefined;
    commune?: string | undefined;
    website?: string | undefined;
    linkedinUrl?: string | undefined;
    facebookUrl?: string | undefined;
    notes?: string | undefined;
    customFields?: Record<string, any> | undefined;
}>;
export declare const updateContactSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    alternatePhone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    company: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    jobTitle: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    industry: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<{
        LEAD: "LEAD";
        CUSTOMER: "CUSTOMER";
        PARTNER: "PARTNER";
        VENDOR: "VENDOR";
    }>>>;
    source: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<{
        WEBSITE: "WEBSITE";
        REFERRAL: "REFERRAL";
        DIRECTORY: "DIRECTORY";
        SOCIAL_MEDIA: "SOCIAL_MEDIA";
        PAID_ADS: "PAID_ADS";
        EVENT: "EVENT";
        COLD_CALL: "COLD_CALL";
        OTHER: "OTHER";
    }>>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    wilaya: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    commune: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    linkedinUrl: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    facebookUrl: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    customFields: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
} & {
    status: z.ZodOptional<z.ZodNativeEnum<{
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
        BLOCKED: "BLOCKED";
    }>>;
    leadScore: z.ZodOptional<z.ZodNumber>;
    nextFollowUpDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    alternatePhone?: string | undefined;
    company?: string | undefined;
    jobTitle?: string | undefined;
    industry?: string | undefined;
    type?: "LEAD" | "CUSTOMER" | "PARTNER" | "VENDOR" | undefined;
    source?: "WEBSITE" | "REFERRAL" | "DIRECTORY" | "SOCIAL_MEDIA" | "PAID_ADS" | "EVENT" | "COLD_CALL" | "OTHER" | undefined;
    tags?: string[] | undefined;
    address?: string | undefined;
    wilaya?: string | undefined;
    commune?: string | undefined;
    website?: string | undefined;
    linkedinUrl?: string | undefined;
    facebookUrl?: string | undefined;
    notes?: string | undefined;
    customFields?: Record<string, any> | undefined;
    status?: "ACTIVE" | "INACTIVE" | "BLOCKED" | undefined;
    leadScore?: number | undefined;
    nextFollowUpDate?: Date | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    alternatePhone?: string | undefined;
    company?: string | undefined;
    jobTitle?: string | undefined;
    industry?: string | undefined;
    type?: "LEAD" | "CUSTOMER" | "PARTNER" | "VENDOR" | undefined;
    source?: "WEBSITE" | "REFERRAL" | "DIRECTORY" | "SOCIAL_MEDIA" | "PAID_ADS" | "EVENT" | "COLD_CALL" | "OTHER" | undefined;
    tags?: string[] | undefined;
    address?: string | undefined;
    wilaya?: string | undefined;
    commune?: string | undefined;
    website?: string | undefined;
    linkedinUrl?: string | undefined;
    facebookUrl?: string | undefined;
    notes?: string | undefined;
    customFields?: Record<string, any> | undefined;
    status?: "ACTIVE" | "INACTIVE" | "BLOCKED" | undefined;
    leadScore?: number | undefined;
    nextFollowUpDate?: Date | undefined;
}>;
export declare const contactFiltersSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodNativeEnum<{
        LEAD: "LEAD";
        CUSTOMER: "CUSTOMER";
        PARTNER: "PARTNER";
        VENDOR: "VENDOR";
    }>>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
        BLOCKED: "BLOCKED";
    }>>;
    source: z.ZodOptional<z.ZodNativeEnum<{
        WEBSITE: "WEBSITE";
        REFERRAL: "REFERRAL";
        DIRECTORY: "DIRECTORY";
        SOCIAL_MEDIA: "SOCIAL_MEDIA";
        PAID_ADS: "PAID_ADS";
        EVENT: "EVENT";
        COLD_CALL: "COLD_CALL";
        OTHER: "OTHER";
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    wilaya: z.ZodOptional<z.ZodString>;
    minLeadScore: z.ZodOptional<z.ZodNumber>;
    maxLeadScore: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "LEAD" | "CUSTOMER" | "PARTNER" | "VENDOR" | undefined;
    source?: "WEBSITE" | "REFERRAL" | "DIRECTORY" | "SOCIAL_MEDIA" | "PAID_ADS" | "EVENT" | "COLD_CALL" | "OTHER" | undefined;
    tags?: string[] | undefined;
    wilaya?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "BLOCKED" | undefined;
    minLeadScore?: number | undefined;
    maxLeadScore?: number | undefined;
    search?: string | undefined;
}, {
    type?: "LEAD" | "CUSTOMER" | "PARTNER" | "VENDOR" | undefined;
    source?: "WEBSITE" | "REFERRAL" | "DIRECTORY" | "SOCIAL_MEDIA" | "PAID_ADS" | "EVENT" | "COLD_CALL" | "OTHER" | undefined;
    tags?: string[] | undefined;
    wilaya?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "BLOCKED" | undefined;
    minLeadScore?: number | undefined;
    maxLeadScore?: number | undefined;
    search?: string | undefined;
}>;
export declare const createDealSchema: z.ZodObject<{
    contactId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    probability: z.ZodOptional<z.ZodNumber>;
    stage: z.ZodOptional<z.ZodNativeEnum<{
        PROSPECTING: "PROSPECTING";
        QUALIFICATION: "QUALIFICATION";
        PROPOSAL: "PROPOSAL";
        NEGOTIATION: "NEGOTIATION";
        CLOSED_WON: "CLOSED_WON";
        CLOSED_LOST: "CLOSED_LOST";
    }>>;
    priority: z.ZodOptional<z.ZodNativeEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    expectedCloseDate: z.ZodOptional<z.ZodDate>;
    customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    contactId: string;
    title: string;
    amount: number;
    customFields?: Record<string, any> | undefined;
    description?: string | undefined;
    probability?: number | undefined;
    stage?: "PROSPECTING" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    expectedCloseDate?: Date | undefined;
}, {
    contactId: string;
    title: string;
    amount: number;
    customFields?: Record<string, any> | undefined;
    description?: string | undefined;
    probability?: number | undefined;
    stage?: "PROSPECTING" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    expectedCloseDate?: Date | undefined;
}>;
export declare const updateDealSchema: z.ZodObject<{
    contactId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    amount: z.ZodOptional<z.ZodNumber>;
    probability: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    stage: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<{
        PROSPECTING: "PROSPECTING";
        QUALIFICATION: "QUALIFICATION";
        PROPOSAL: "PROPOSAL";
        NEGOTIATION: "NEGOTIATION";
        CLOSED_WON: "CLOSED_WON";
        CLOSED_LOST: "CLOSED_LOST";
    }>>>;
    priority: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>>;
    expectedCloseDate: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    customFields: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
} & {
    lostReason: z.ZodOptional<z.ZodString>;
    winReason: z.ZodOptional<z.ZodString>;
    actualCloseDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    customFields?: Record<string, any> | undefined;
    contactId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    amount?: number | undefined;
    probability?: number | undefined;
    stage?: "PROSPECTING" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    expectedCloseDate?: Date | undefined;
    lostReason?: string | undefined;
    winReason?: string | undefined;
    actualCloseDate?: Date | undefined;
}, {
    customFields?: Record<string, any> | undefined;
    contactId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    amount?: number | undefined;
    probability?: number | undefined;
    stage?: "PROSPECTING" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    expectedCloseDate?: Date | undefined;
    lostReason?: string | undefined;
    winReason?: string | undefined;
    actualCloseDate?: Date | undefined;
}>;
export declare const dealFiltersSchema: z.ZodObject<{
    stage: z.ZodOptional<z.ZodNativeEnum<{
        PROSPECTING: "PROSPECTING";
        QUALIFICATION: "QUALIFICATION";
        PROPOSAL: "PROPOSAL";
        NEGOTIATION: "NEGOTIATION";
        CLOSED_WON: "CLOSED_WON";
        CLOSED_LOST: "CLOSED_LOST";
    }>>;
    priority: z.ZodOptional<z.ZodNativeEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    minAmount: z.ZodOptional<z.ZodNumber>;
    maxAmount: z.ZodOptional<z.ZodNumber>;
    contactId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    contactId?: string | undefined;
    stage?: "PROSPECTING" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    search?: string | undefined;
    minAmount?: number | undefined;
    maxAmount?: number | undefined;
}, {
    contactId?: string | undefined;
    stage?: "PROSPECTING" | "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    search?: string | undefined;
    minAmount?: number | undefined;
    maxAmount?: number | undefined;
}>;
export declare const createActivitySchema: z.ZodObject<{
    contactId: z.ZodOptional<z.ZodString>;
    dealId: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<{
        CALL: "CALL";
        EMAIL: "EMAIL";
        MEETING: "MEETING";
        TASK: "TASK";
        NOTE: "NOTE";
        SMS: "SMS";
    }>;
    subject: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodNativeEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    scheduledAt: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE" | "SMS";
    subject: string;
    contactId?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dealId?: string | undefined;
    scheduledAt?: Date | undefined;
    duration?: number | undefined;
}, {
    type: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE" | "SMS";
    subject: string;
    contactId?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dealId?: string | undefined;
    scheduledAt?: Date | undefined;
    duration?: number | undefined;
}>;
export declare const updateActivitySchema: z.ZodObject<{
    contactId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dealId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodNativeEnum<{
        CALL: "CALL";
        EMAIL: "EMAIL";
        MEETING: "MEETING";
        TASK: "TASK";
        NOTE: "NOTE";
        SMS: "SMS";
    }>>;
    subject: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>>;
    scheduledAt: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    duration: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
} & {
    status: z.ZodOptional<z.ZodNativeEnum<{
        PENDING: "PENDING";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
    }>>;
    completedAt: z.ZodOptional<z.ZodDate>;
    outcome: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE" | "SMS" | undefined;
    status?: "PENDING" | "COMPLETED" | "CANCELLED" | undefined;
    contactId?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dealId?: string | undefined;
    subject?: string | undefined;
    scheduledAt?: Date | undefined;
    duration?: number | undefined;
    completedAt?: Date | undefined;
    outcome?: string | undefined;
}, {
    type?: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE" | "SMS" | undefined;
    status?: "PENDING" | "COMPLETED" | "CANCELLED" | undefined;
    contactId?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dealId?: string | undefined;
    subject?: string | undefined;
    scheduledAt?: Date | undefined;
    duration?: number | undefined;
    completedAt?: Date | undefined;
    outcome?: string | undefined;
}>;
export declare const activityFiltersSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodNativeEnum<{
        CALL: "CALL";
        EMAIL: "EMAIL";
        MEETING: "MEETING";
        TASK: "TASK";
        NOTE: "NOTE";
        SMS: "SMS";
    }>>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        PENDING: "PENDING";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
    }>>;
    contactId: z.ZodOptional<z.ZodString>;
    dealId: z.ZodOptional<z.ZodString>;
    fromDate: z.ZodOptional<z.ZodDate>;
    toDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    type?: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE" | "SMS" | undefined;
    status?: "PENDING" | "COMPLETED" | "CANCELLED" | undefined;
    contactId?: string | undefined;
    dealId?: string | undefined;
    fromDate?: Date | undefined;
    toDate?: Date | undefined;
}, {
    type?: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE" | "SMS" | undefined;
    status?: "PENDING" | "COMPLETED" | "CANCELLED" | undefined;
    contactId?: string | undefined;
    dealId?: string | undefined;
    fromDate?: Date | undefined;
    toDate?: Date | undefined;
}>;
export declare const createTaskSchema: z.ZodObject<{
    contactId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodNativeEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    dueDate: z.ZodOptional<z.ZodDate>;
    assignedTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    contactId?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dueDate?: Date | undefined;
    assignedTo?: string | undefined;
}, {
    title: string;
    contactId?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dueDate?: Date | undefined;
    assignedTo?: string | undefined;
}>;
export declare const updateTaskSchema: z.ZodObject<{
    contactId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>>;
    dueDate: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    assignedTo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodNativeEnum<{
        PENDING: "PENDING";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
    }>>;
    completedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    status?: "PENDING" | "COMPLETED" | "CANCELLED" | undefined;
    contactId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    completedAt?: Date | undefined;
    dueDate?: Date | undefined;
    assignedTo?: string | undefined;
}, {
    status?: "PENDING" | "COMPLETED" | "CANCELLED" | undefined;
    contactId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    completedAt?: Date | undefined;
    dueDate?: Date | undefined;
    assignedTo?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T;
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
//# sourceMappingURL=validation.d.ts.map