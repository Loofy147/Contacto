import {
  ContactType,
  ContactStatus,
  LeadSource,
  DealStage,
  ActivityType,
  ActivityStatus,
  Priority
} from '@prisma/client';

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  type?: ContactType;
  source?: LeadSource;
  tags?: string[];
  address?: string;
  wilaya?: string;
  commune?: string;
  website?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {
  status?: ContactStatus;
  leadScore?: number;
  nextFollowUpDate?: Date;
}

export interface ContactResponse {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  type: ContactType;
  status: ContactStatus;
  source?: LeadSource;
  tags: string[];
  leadScore: number;
  lifetimeValue: number;
  totalDeals: number;
  totalRevenue: number;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDealRequest {
  contactId: string;
  title: string;
  description?: string;
  amount: number;
  probability?: number;
  stage?: DealStage;
  priority?: Priority;
  expectedCloseDate?: Date;
  customFields?: Record<string, any>;
}

export interface UpdateDealRequest extends Partial<CreateDealRequest> {
  lostReason?: string;
  winReason?: string;
  actualCloseDate?: Date;
}

export interface DealResponse {
  id: string;
  contactId: string;
  title: string;
  amount: number;
  currency: string;
  probability: number;
  expectedRevenue: number;
  stage: DealStage;
  priority: Priority;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActivityRequest {
  contactId?: string;
  dealId?: string;
  type: ActivityType;
  subject: string;
  description?: string;
  priority?: Priority;
  scheduledAt?: Date;
  duration?: number;
}

export interface UpdateActivityRequest extends Partial<CreateActivityRequest> {
  status?: ActivityStatus;
  completedAt?: Date;
  outcome?: string;
}

export interface ActivityResponse {
  id: string;
  contactId?: string;
  dealId?: string;
  type: ActivityType;
  subject: string;
  status: ActivityStatus;
  priority: Priority;
  scheduledAt?: Date;
  completedAt?: Date;
  duration?: number;
  outcome?: string;
  createdAt: Date;
}

export interface CreateTaskRequest {
  contactId?: string;
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date;
  assignedTo?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: ActivityStatus;
  completedAt?: Date;
}

export interface TaskResponse {
  id: string;
  contactId?: string;
  title: string;
  description?: string;
  status: ActivityStatus;
  priority: Priority;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// ============================================
// QUERY/FILTER TYPES
// ============================================

export interface ContactFilters {
  type?: ContactType;
  status?: ContactStatus;
  source?: LeadSource;
  tags?: string[];
  wilaya?: string;
  minLeadScore?: number;
  maxLeadScore?: number;
  search?: string; // Search across name, email, phone, company
}

export interface DealFilters {
  stage?: DealStage;
  priority?: Priority;
  minAmount?: number;
  maxAmount?: number;
  contactId?: string;
  search?: string;
}

export interface ActivityFilters {
  type?: ActivityType;
  status?: ActivityStatus;
  contactId?: string;
  dealId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface PipelineMetrics {
  totalDeals: number;
  totalValue: number;
  averageDealSize: number;
  winRate: number;
  averageSalesCycle: number; // days
  byStage: {
    stage: DealStage;
    count: number;
    value: number;
  }[];
}

export interface ContactMetrics {
  totalContacts: number;
  byType: Record<ContactType, number>;
  bySource: Record<LeadSource, number>;
  averageLeadScore: number;
  conversionRate: number;
}

export interface ActivityMetrics {
  totalActivities: number;
  completedActivities: number;
  pendingActivities: number;
  byType: Record<ActivityType, number>;
  completionRate: number;
}

// ============================================
// ERROR TYPES
// ============================================

export class CRMError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'CRMError';
  }
}

export class NotFoundError extends CRMError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends CRMError {
  constructor(message: string, public errors?: any[]) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class DuplicateError extends CRMError {
  constructor(resource: string, field: string) {
    super(
      `${resource} with this ${field} already exists`,
      'DUPLICATE',
      409
    );
    this.name = 'DuplicateError';
  }
}

// ============================================
// UTILITY TYPES
// ============================================

export type SortOrder = 'asc' | 'desc';

export interface ServiceContext {
  professionalId: string;
  userId: string;
}
