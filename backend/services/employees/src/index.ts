// ============================================================================
// EMPLOYEES & SETTINGS SERVICES: BACKEND IMPLEMENTATION
// ============================================================================
// TypeScript + Express.js + Prisma ORM
// Features: RBAC, Activity Logging, Input Validation, Error Handling
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    merchantId: string;
    employeeId?: string;
    permissions: string[];
  };
}

interface ActivityLog {
  merchantId: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  changes?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

// ============================================================================
// MIDDLEWARE: RBAC (Role-Based Access Control)
// ============================================================================

class RBACMiddleware {
  /**
   * Check if user has required permission
   * @param requiredPermission - Permission slug (e.g., 'sales.create')
   * @param options - Additional options like scope checking
   */
  static requirePermission(
    requiredPermission: string,
    options?: { scope?: 'own' | 'team' | 'all' }
  ) {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { user } = req;
        
        if (!user) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          });
        }

        // Check if user has the required permission
        const hasPermission = user.permissions.includes(requiredPermission);
        
        if (!hasPermission) {
          // Log unauthorized access attempt
          await ActivityLogger.log({
            merchantId: user.merchantId,
            actorId: user.employeeId,
            action: 'unauthorized_access_attempt',
            resourceType: 'permission',
            resourceId: requiredPermission,
            description: `Attempted to access resource requiring ${requiredPermission}`,
            severity: 'high',
            metadata: {
              endpoint: req.path,
              method: req.method
            }
          });

          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to perform this action'
            }
          });
        }

        // If scope checking is required
        if (options?.scope) {
          // Get the permission details to check scope
          const permission = await prisma.permissions.findFirst({
            where: { slug: requiredPermission }
          });

          if (permission && permission.scope !== 'all') {
            // Implement scope checking logic
            // For 'own' scope: Can only access their own resources
            // For 'team' scope: Can access team member resources
            // This would be implemented based on specific resource types
            req.user!.permissionScope = permission.scope;
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Check if user has any of the required roles
   */
  static requireRole(...roles: string[]) {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { user } = req;
        
        if (!user || !user.employeeId) {
          return res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
          });
        }

        // Get employee's role
        const employee = await prisma.employees.findUnique({
          where: { id: user.employeeId },
          include: {
            role: true
          }
        });

        if (!employee || !employee.role) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'No role assigned' }
          });
        }

        const hasRole = roles.includes(employee.role.slug);
        
        if (!hasRole) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: `Required role: ${roles.join(' or ')}`
            }
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

// ============================================================================
// UTILITY: Activity Logger
// ============================================================================

class ActivityLogger {
  static async log(activity: ActivityLog): Promise<void> {
    try {
      // Set current employee ID in session (for trigger)
      if (activity.actorId) {
        await prisma.$executeRawUnsafe(
          `SET LOCAL app.current_employee_id = '${activity.actorId}'`
        );
      }

      await prisma.activity_log.create({
        data: {
          merchant_id: activity.merchantId,
          actor_id: activity.actorId,
          action: activity.action,
          resource_type: activity.resourceType,
          resource_id: activity.resourceId,
          description: activity.description,
          changes: activity.changes,
          severity: activity.severity,
          metadata: activity.metadata,
          actor_ip: activity.metadata?.ip,
          user_agent: activity.metadata?.userAgent
        }
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }
}

// ============================================================================
// VALIDATION SCHEMAS (Zod)
// ============================================================================

const CreateEmployeeSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  employeeId: z.string().max(50).optional(),
  position: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  hireDate: z.string().datetime().optional(),
  roleId: z.string().uuid(),
  pinCode: z.string().length(4).regex(/^\d+$/).optional(),
  customPermissions: z.array(z.string()).optional()
});

const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

const CreateRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  parentRoleId: z.string().uuid().optional(),
  permissions: z.array(z.string().uuid())
});

const UpdateSettingsSchema = z.object({
  businessName: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  wilaya: z.string().max(50).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional()
});

// ============================================================================
// EMPLOYEES SERVICE - CONTROLLERS
// ============================================================================

class EmployeesController {
  /**
   * List all employees
   * GET /api/v1/employees
   */
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.user!;
      const { status, roleId, search, page = 1, limit = 20 } = req.query;

      // Build filters
      const where: any = {
        merchant_id: merchantId,
        ...(status && { status }),
        ...(roleId && { role_id: roleId })
      };

      // Search by name or email
      if (search) {
        where.OR = [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [employees, total] = await Promise.all([
        prisma.employees.findMany({
          where,
          include: {
            role: {
              select: { id: true, name: true, slug: true, color: true }
            }
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { created_at: 'desc' }
        }),
        prisma.employees.count({ where })
      ]);

      // Remove sensitive data
      const sanitized = employees.map(emp => {
        const { pin_code, salary_amount, two_factor_secret, ...safe } = emp;
        return safe;
      });

      res.json({
        success: true,
        data: {
          employees: sanitized,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single employee
   * GET /api/v1/employees/:id
   */
  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { merchantId } = req.user!;

      const employee = await prisma.employees.findFirst({
        where: {
          id,
          merchant_id: merchantId
        },
        include: {
          role: {
            include: {
              role_permissions: {
                include: {
                  permission: true
                }
              }
            }
          },
          user: {
            select: { id: true, email: true, avatar_url: true }
          }
        }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' }
        });
      }

      // Remove sensitive data
      const { pin_code, two_factor_secret, ...safeEmployee } = employee;

      // Get performance metrics
      const performance = await prisma.$queryRaw`
        SELECT * FROM mv_employee_performance
        WHERE employee_id = ${id}
      `;

      res.json({
        success: true,
        data: {
          ...safeEmployee,
          performance: performance[0] || null
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create employee (invite)
   * POST /api/v1/employees
   */
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId, employeeId: actorId } = req.user!;
      
      // Validate input
      const data = CreateEmployeeSchema.parse(req.body);

      // Check if email already exists
      const existing = await prisma.employees.findFirst({
        where: {
          merchant_id: merchantId,
          email: data.email
        }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'Email already in use' }
        });
      }

      // Generate invitation token
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Hash PIN if provided
      let hashedPin;
      if (data.pinCode) {
        hashedPin = await bcrypt.hash(data.pinCode, 10);
      }

      // Create employee
      const employee = await prisma.employees.create({
        data: {
          merchant_id: merchantId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          employee_id: data.employeeId,
          position: data.position,
          department: data.department,
          hire_date: data.hireDate ? new Date(data.hireDate) : null,
          role_id: data.roleId,
          pin_code: hashedPin,
          pin_enabled: !!data.pinCode,
          custom_permissions: data.customPermissions || [],
          status: 'pending',
          invitation_token: invitationToken,
          invitation_expires_at: invitationExpiresAt
        },
        include: {
          role: true
        }
      });

      // Log activity
      await ActivityLogger.log({
        merchantId,
        actorId,
        action: 'created',
        resourceType: 'employee',
        resourceId: employee.id,
        description: `Created employee: ${employee.first_name} ${employee.last_name}`,
        severity: 'medium',
        metadata: { email: employee.email }
      });

      // TODO: Send invitation email
      // await EmailService.sendEmployeeInvitation(employee.email, invitationToken);

      // Remove sensitive data
      const { pin_code, invitation_token, ...safeEmployee } = employee;

      res.status(201).json({
        success: true,
        data: safeEmployee,
        message: 'Employee invited successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors
          }
        });
      }
      next(error);
    }
  }

  /**
   * Update employee
   * PUT /api/v1/employees/:id
   */
  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { merchantId, employeeId: actorId } = req.user!;
      
      // Validate input
      const data = UpdateEmployeeSchema.parse(req.body);

      // Get current employee
      const currentEmployee = await prisma.employees.findFirst({
        where: { id, merchant_id: merchantId }
      });

      if (!currentEmployee) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' }
        });
      }

      // Update employee
      const updated = await prisma.employees.update({
        where: { id },
        data: {
          ...(data.firstName && { first_name: data.firstName }),
          ...(data.lastName && { last_name: data.lastName }),
          ...(data.email && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.position !== undefined && { position: data.position }),
          ...(data.department !== undefined && { department: data.department }),
          ...(data.roleId && { role_id: data.roleId }),
          updated_at: new Date()
        },
        include: { role: true }
      });

      // Log activity
      await ActivityLogger.log({
        merchantId,
        actorId,
        action: 'updated',
        resourceType: 'employee',
        resourceId: id,
        description: `Updated employee: ${updated.first_name} ${updated.last_name}`,
        severity: 'medium',
        changes: {
          before: currentEmployee,
          after: updated
        }
      });

      // Remove sensitive data
      const { pin_code, two_factor_secret, ...safeEmployee } = updated;

      res.json({
        success: true,
        data: safeEmployee
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors
          }
        });
      }
      next(error);
    }
  }

  /**
   * Delete employee (soft delete)
   * DELETE /api/v1/employees/:id
   */
  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { merchantId, employeeId: actorId } = req.user!;

      const employee = await prisma.employees.findFirst({
        where: { id, merchant_id: merchantId }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' }
        });
      }

      // Soft delete
      await prisma.employees.update({
        where: { id },
        data: {
          is_active: false,
          status: 'terminated',
          termination_date: new Date()
        }
      });

      // Log activity
      await ActivityLogger.log({
        merchantId,
        actorId,
        action: 'deleted',
        resourceType: 'employee',
        resourceId: id,
        description: `Terminated employee: ${employee.first_name} ${employee.last_name}`,
        severity: 'high'
      });

      res.json({
        success: true,
        message: 'Employee terminated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee performance
   * GET /api/v1/employees/:id/performance
   */
  static async getPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { merchantId } = req.user!;

      // Verify employee exists and belongs to merchant
      const employee = await prisma.employees.findFirst({
        where: { id, merchant_id: merchantId }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' }
        });
      }

      // Get performance data from materialized view
      const performance = await prisma.$queryRaw`
        SELECT * FROM mv_employee_performance
        WHERE employee_id = ${id}
      `;

      // Get recent sales
      const recentSales = await prisma.transactions.findMany({
        where: {
          merchant_id: merchantId,
          items: {
            path: ['sold_by'],
            equals: id
          }
        },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          id: true,
          total_amount: true,
          created_at: true,
          payment_status: true
        }
      });

      res.json({
        success: true,
        data: {
          summary: performance[0] || null,
          recentSales
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

// ============================================================================
// ROLES CONTROLLER
// ============================================================================

class RolesController {
  /**
   * List all roles
   * GET /api/v1/roles
   */
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.user!;

      const roles = await prisma.roles.findMany({
        where: { merchant_id: merchantId },
        include: {
          role_permissions: {
            include: {
              permission: {
                select: { id: true, name: true, slug: true, category: true }
              }
            }
          },
          _count: {
            select: { employees: true }
          }
        },
        orderBy: { level: 'asc' }
      });

      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create custom role
   * POST /api/v1/roles
   */
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId, employeeId: actorId } = req.user!;
      const data = CreateRoleSchema.parse(req.body);

      // Generate slug
      const slug = data.name.toLowerCase().replace(/\s+/g, '_');

      // Create role
      const role = await prisma.roles.create({
        data: {
          merchant_id: merchantId,
          name: data.name,
          slug,
          description: data.description,
          color: data.color || '#3b82f6',
          parent_role_id: data.parentRoleId,
          is_custom: true,
          level: data.parentRoleId ? 1 : 0
        }
      });

      // Assign permissions
      if (data.permissions && data.permissions.length > 0) {
        await prisma.role_permissions.createMany({
          data: data.permissions.map(permId => ({
            role_id: role.id,
            permission_id: permId
          }))
        });
      }

      // Log activity
      await ActivityLogger.log({
        merchantId,
        actorId,
        action: 'created',
        resourceType: 'role',
        resourceId: role.id,
        description: `Created role: ${role.name}`,
        severity: 'high'
      });

      // Fetch complete role
      const complete = await prisma.roles.findUnique({
        where: { id: role.id },
        include: {
          role_permissions: {
            include: { permission: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: complete
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            details: error.errors
          }
        });
      }
      next(error);
    }
  }
}

// ============================================================================
// SETTINGS CONTROLLER
// ============================================================================

class SettingsController {
  /**
   * Get all settings
   * GET /api/v1/settings
   */
  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.user!;

      const [business, pos, notifications] = await Promise.all([
        prisma.business_settings.findUnique({
          where: { merchant_id: merchantId }
        }),
        prisma.pos_settings.findUnique({
          where: { merchant_id: merchantId }
        }),
        prisma.notification_settings.findUnique({
          where: { merchant_id: merchantId }
        })
      ]);

      res.json({
        success: true,
        data: {
          business,
          pos,
          notifications
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update business settings
   * PUT /api/v1/settings/business
   */
  static async updateBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId, employeeId: actorId } = req.user!;
      const data = UpdateSettingsSchema.parse(req.body);

      const updated = await prisma.business_settings.upsert({
        where: { merchant_id: merchantId },
        update: {
          ...(data.businessName && { business_name: data.businessName }),
          ...(data.email && { email: data.email }),
          ...(data.phone && { phone: data.phone }),
          ...(data.address && { address: data.address }),
          ...(data.city && { city: data.city }),
          ...(data.wilaya && { wilaya: data.wilaya }),
          ...(data.logoUrl && { logo_url: data.logoUrl }),
          ...(data.primaryColor && { primary_color: data.primaryColor }),
          ...(data.currency && { currency: data.currency }),
          ...(data.timezone && { timezone: data.timezone }),
          updated_at: new Date()
        },
        create: {
          merchant_id: merchantId,
          business_name: data.businessName || 'My Business',
          ...data
        }
      });

      // Log activity
      await ActivityLogger.log({
        merchantId,
        actorId,
        action: 'updated',
        resourceType: 'business_settings',
        description: 'Updated business settings',
        severity: 'medium'
      });

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            details: error.errors
          }
        });
      }
      next(error);
    }
  }

  /**
   * Get API keys
   * GET /api/v1/settings/api-keys
   */
  static async listApiKeys(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.user!;

      const keys = await prisma.api_keys.findMany({
        where: { merchant_id: merchantId },
        select: {
          id: true,
          name: true,
          description: true,
          key_prefix: true,
          permissions: true,
          is_active: true,
          last_used_at: true,
          usage_count: true,
          expires_at: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' }
      });

      res.json({
        success: true,
        data: keys
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create API key
   * POST /api/v1/settings/api-keys
   */
  static async createApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId, employeeId: actorId } = req.user!;
      const { name, description, permissions, expiresIn } = req.body;

      // Generate random API key
      const apiKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
      const keyHash = await bcrypt.hash(apiKey, 10);
      const keyPrefix = apiKey.substring(0, 12);

      // Calculate expiration
      let expiresAt;
      if (expiresIn) {
        expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
      }

      const key = await prisma.api_keys.create({
        data: {
          merchant_id: merchantId,
          name,
          description,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: permissions || [],
          expires_at: expiresAt,
          created_by: actorId
        }
      });

      // Log activity
      await ActivityLogger.log({
        merchantId,
        actorId,
        action: 'created',
        resourceType: 'api_key',
        resourceId: key.id,
        description: `Created API key: ${name}`,
        severity: 'critical'
      });

      res.status(201).json({
        success: true,
        data: {
          id: key.id,
          name: key.name,
          key: apiKey, // Only shown once!
          expiresAt: key.expires_at
        },
        message: 'Save this key securely. It will not be shown again.'
      });
    } catch (error) {
      next(error);
    }
  }
}

// ============================================================================
// ACTIVITY LOG CONTROLLER
// ============================================================================

class ActivityLogController {
  /**
   * Get activity log
   * GET /api/v1/activity
   */
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.user!;
      const {
        resourceType,
        actorId,
        severity,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = req.query;

      const where: any = {
        merchant_id: merchantId,
        ...(resourceType && { resource_type: resourceType }),
        ...(actorId && { actor_id: actorId }),
        ...(severity && { severity })
      };

      // Date range filter
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.gte = new Date(startDate as string);
        if (endDate) where.created_at.lte = new Date(endDate as string);
      }

      const [logs, total] = await Promise.all([
        prisma.activity_log.findMany({
          where,
          include: {
            actor: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          },
          orderBy: { created_at: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit)
        }),
        prisma.activity_log.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

// ============================================================================
// ROUTES DEFINITION
// ============================================================================

import express from 'express';

const router = express.Router();

// Employees routes
router.get(
  '/employees',
  RBACMiddleware.requirePermission('employees.read'),
  EmployeesController.list
);

router.get(
  '/employees/:id',
  RBACMiddleware.requirePermission('employees.read'),
  EmployeesController.get
);

router.post(
  '/employees',
  RBACMiddleware.requirePermission('employees.create'),
  EmployeesController.create
);

router.put(
  '/employees/:id',
  RBACMiddleware.requirePermission('employees.update'),
  EmployeesController.update
);

router.delete(
  '/employees/:id',
  RBACMiddleware.requirePermission('employees.delete'),
  EmployeesController.delete
);

router.get(
  '/employees/:id/performance',
  RBACMiddleware.requirePermission('reports.sales.read'),
  EmployeesController.getPerformance
);

// Roles routes
router.get(
  '/roles',
  RBACMiddleware.requirePermission('employees.read'),
  RolesController.list
);

router.post(
  '/roles',
  RBACMiddleware.requirePermission('employees.roles.manage'),
  RolesController.create
);

// Settings routes
router.get(
  '/settings',
  RBACMiddleware.requirePermission('settings.read'),
  SettingsController.get
);

router.put(
  '/settings/business',
  RBACMiddleware.requirePermission('settings.update'),
  SettingsController.updateBusiness
);

router.get(
  '/settings/api-keys',
  RBACMiddleware.requirePermission('settings.api_keys.read'),
  SettingsController.listApiKeys
);

router.post(
  '/settings/api-keys',
  RBACMiddleware.requirePermission('settings.api_keys.manage'),
  SettingsController.createApiKey
);

// Activity log routes
router.get(
  '/activity',
  RBACMiddleware.requirePermission('employees.read'),
  ActivityLogController.list
);

export default router;

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  if (err.code === 'P2002') {
    // Prisma unique constraint violation
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A record with this value already exists'
      }
    });
  }

  if (err.code === 'P2025') {
    // Prisma record not found
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Record not found'
      }
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import express from 'express';
import employeesSettingsRouter from './employees-settings-service';
import { errorHandler } from './employees-settings-service';

const app = express();

app.use(express.json());
app.use('/api/v1', employeesSettingsRouter);
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Employees & Settings Service running on port 3000');
});
*/
const app = express();
app.use(express.json());
app.use('/api/v1/employees', router);
app.use(errorHandler);

const port = process.env.PORT || 3009;
app.listen(port, () => {
  console.log(`Employees Service started on port ${port}`);
});
