// ============================================================================
// EMPLOYEES & SETTINGS SERVICES: BACKEND IMPLEMENTATION
// ============================================================================

import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate } from './middleware/validate';
import { employeeSchemas } from './schemas/employees.schemas';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    merchantId: string;
    employeeId?: string;
    permissions: string[];
    permissionScope?: string;
  };
}

class RBACMiddleware {
  static requirePermission(requiredPermission: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { user } = req;
        if (!user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        if (!user.permissions.includes(requiredPermission)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No permission' } });
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

class EmployeesController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.user!;
      const employees = await prisma.employee.findMany({ where: { merchantId } });
      res.json({ success: true, data: employees });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { merchantId } = req.user!;
      const data = req.body;
      const employee = await prisma.employee.create({
        data: {
          merchantId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          roleId: data.roleId,
          status: 'pending'
        }
      });
      res.status(201).json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }
}

const router = express.Router();
router.get('/employees', RBACMiddleware.requirePermission('employees.read'), EmployeesController.list);
router.post('/employees', RBACMiddleware.requirePermission('employees.create'), validate(employeeSchemas.createEmployee), EmployeesController.create);

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } });
}

const app = express();
app.use(express.json());
app.use('/api/v1', router);
app.use(errorHandler);

const port = process.env.PORT || 3009;
app.listen(port, () => {
  console.log(`Employees Service started on port ${port}`);
});
