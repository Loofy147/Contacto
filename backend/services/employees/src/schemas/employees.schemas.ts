import { z } from 'zod';

export const employeeSchemas = {
  createEmployee: z.object({
    body: z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      employeeId: z.string().optional(),
      position: z.string().optional(),
      department: z.string().optional(),
      hireDate: z.string().datetime().optional(),
      roleId: z.string().uuid(),
      pinCode: z.string().length(4).regex(/^\d+$/).optional(),
      customPermissions: z.array(z.string()).optional(),
    }),
  }),
};
