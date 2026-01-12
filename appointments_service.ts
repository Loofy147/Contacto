// backend/services/appointments/src/controllers/appointment.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { kafka } from '../lib/kafka';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { addMinutes, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

export class AppointmentController {
  /**
   * Create new appointment
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { professionalId, scheduledAt, duration, serviceName, notes } = req.body;

      // Validate professional exists
      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional not found');
      }

      // Check if time slot is available
      const isAvailable = await this.checkAvailability(
        professionalId,
        new Date(scheduledAt),
        duration
      );

      if (!isAvailable) {
        throw new AppError(409, 'TIME_SLOT_UNAVAILABLE', 'This time slot is not available');
      }

      // Check for conflicts
      const hasConflict = await this.hasScheduleConflict(
        professionalId,
        new Date(scheduledAt),
        duration
      );

      if (hasConflict) {
        throw new AppError(409, 'SCHEDULE_CONFLICT', 'There is a scheduling conflict');
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
        },
      });

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          professionalId,
          userId,
          scheduledAt: new Date(scheduledAt),
          duration,
          serviceName,
          notes,
          status: 'PENDING',
        },
        include: {
          professional: {
            select: {
              businessName: true,
              phone: true,
              email: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // Publish event for notifications
      await kafka.send({
        topic: 'appointment.events',
        messages: [{
          key: appointment.id,
          value: JSON.stringify({
            eventType: 'APPOINTMENT_CREATED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              appointmentId: appointment.id,
              professionalId,
              customerId: userId,
              customerEmail: user?.email,
              customerPhone: user?.phone,
              professionalEmail: professional.user.email,
              businessName: professional.businessName,
              scheduledAt,
              serviceName,
            },
          }),
        }],
      });

      // Schedule reminder (24 hours before)
      await this.scheduleReminder(appointment.id, new Date(scheduledAt));

      // Invalidate cache
      await redis.del(`appointments:professional:${professionalId}`);
      await redis.del(`appointments:user:${userId}`);

      logger.info('Appointment created', { appointmentId: appointment.id });

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: { appointment },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's appointments
   */
  getUserAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { status, upcoming = 'true' } = req.query;

      const now = new Date();
      
      const appointments = await prisma.appointment.findMany({
        where: {
          userId,
          ...(status && { status: status as any }),
          ...(upcoming === 'true' && { scheduledAt: { gte: now } }),
          ...(upcoming === 'false' && { scheduledAt: { lt: now } }),
        },
        include: {
          professional: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true,
              phone: true,
              email: true,
              wilaya: true,
              address: true,
            },
          },
        },
        orderBy: {
          scheduledAt: upcoming === 'true' ? 'asc' : 'desc',
        },
      });

      res.json({
        success: true,
        data: { appointments },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get professional's appointments
   */
  getProfessionalAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { date, status } = req.query;

      const professional = await prisma.professional.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional profile not found');
      }

      // Build query filters
      const where: any = {
        professionalId: professional.id,
        ...(status && { status: status as any }),
      };

      // If date is provided, get appointments for that day
      if (date) {
        const targetDate = new Date(date as string);
        where.scheduledAt = {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        };
      }

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });

      res.json({
        success: true,
        data: { appointments },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get availability for a professional
   */
  getAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { professionalId } = req.params;
      const { date } = req.query;

      if (!date) {
        throw new AppError(400, 'DATE_REQUIRED', 'Date parameter is required');
      }

      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
        select: {
          workingHours: true,
        },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional not found');
      }

      const targetDate = new Date(date as string);
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

      // Get working hours for the day
      const workingHours = (professional.workingHours as any)?.[dayName];

      if (!workingHours || !workingHours.open) {
        return res.json({
          success: true,
          data: {
            date,
            available: false,
            message: 'Professional is not available on this day',
            slots: [],
          },
        });
      }

      // Generate time slots (30-minute intervals)
      const slots = await this.generateTimeSlots(
        professionalId,
        targetDate,
        workingHours.open,
        workingHours.close,
        30 // slot duration in minutes
      );

      res.json({
        success: true,
        data: {
          date,
          available: true,
          workingHours,
          slots,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Confirm appointment
   */
  confirm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      // Get appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          professional: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
      }

      // Verify user is the professional
      if (appointment.professional.userId !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'You cannot confirm this appointment');
      }

      // Update status
      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      // Publish event
      await kafka.send({
        topic: 'appointment.events',
        messages: [{
          key: id,
          value: JSON.stringify({
            eventType: 'APPOINTMENT_CONFIRMED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              appointmentId: id,
              professionalId: appointment.professionalId,
              customerId: appointment.userId,
            },
          }),
        }],
      });

      res.json({
        success: true,
        message: 'Appointment confirmed',
        data: { appointment: updated },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel appointment
   */
  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { reason } = req.body;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          professional: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
      }

      // Verify user is either the customer or the professional
      const isProfessional = appointment.professional.userId === userId;
      const isCustomer = appointment.userId === userId;

      if (!isProfessional && !isCustomer) {
        throw new AppError(403, 'FORBIDDEN', 'You cannot cancel this appointment');
      }

      // Check if appointment is in the past
      if (isBefore(new Date(appointment.scheduledAt), new Date())) {
        throw new AppError(400, 'CANNOT_CANCEL_PAST', 'Cannot cancel past appointments');
      }

      // Update status
      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancelReason: reason,
        },
      });

      // Publish event
      await kafka.send({
        topic: 'appointment.events',
        messages: [{
          key: id,
          value: JSON.stringify({
            eventType: 'APPOINTMENT_CANCELLED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              appointmentId: id,
              customerEmail: appointment.user.email,
              professionalEmail: appointment.professional.user.email,
              businessName: appointment.professional.businessName,
              cancelReason: reason,
              cancelledBy: isProfessional ? 'professional' : 'customer',
            },
          }),
        }],
      });

      // Invalidate cache
      await redis.del(`appointments:professional:${appointment.professionalId}`);
      await redis.del(`appointments:user:${appointment.userId}`);

      res.json({
        success: true,
        message: 'Appointment cancelled',
        data: { appointment: updated },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark appointment as completed
   */
  complete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          professional: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
      }

      // Only professional can mark as completed
      if (appointment.professional.userId !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Only the professional can mark this as completed');
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'COMPLETED',
        },
      });

      // Publish event
      await kafka.send({
        topic: 'appointment.events',
        messages: [{
          key: id,
          value: JSON.stringify({
            eventType: 'APPOINTMENT_COMPLETED',
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            data: {
              appointmentId: id,
              customerId: appointment.userId,
              professionalId: appointment.professionalId,
            },
          }),
        }],
      });

      res.json({
        success: true,
        message: 'Appointment marked as completed',
        data: { appointment: updated },
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async checkAvailability(
    professionalId: string,
    scheduledAt: Date,
    duration: number
  ): Promise<boolean> {
    // Check if the time is in the future
    if (isBefore(scheduledAt, new Date())) {
      return false;
    }

    // Check working hours
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: { workingHours: true },
    });

    if (!professional) return false;

    const dayName = scheduledAt.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const workingHours = (professional.workingHours as any)?.[dayName];

    if (!workingHours || !workingHours.open) {
      return false;
    }

    // Parse working hours
    const [openHour, openMin] = workingHours.open.split(':').map(Number);
    const [closeHour, closeMin] = workingHours.close.split(':').map(Number);

    const openTime = new Date(scheduledAt);
    openTime.setHours(openHour, openMin, 0, 0);

    const closeTime = new Date(scheduledAt);
    closeTime.setHours(closeHour, closeMin, 0, 0);

    const endTime = addMinutes(scheduledAt, duration);

    return (
      (isAfter(scheduledAt, openTime) || scheduledAt.getTime() === openTime.getTime()) &&
      (isBefore(endTime, closeTime) || endTime.getTime() === closeTime.getTime())
    );
  }

  private async hasScheduleConflict(
    professionalId: string,
    scheduledAt: Date,
    duration: number
  ): Promise<boolean> {
    const endTime = addMinutes(scheduledAt, duration);

    // Check for overlapping appointments
    const conflicts = await prisma.appointment.findMany({
      where: {
        professionalId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            // New appointment starts during existing appointment
            AND: [
              { scheduledAt: { lte: scheduledAt } },
              {
                scheduledAt: {
                  gte: new Date(scheduledAt.getTime() - duration * 60 * 1000),
                },
              },
            ],
          },
          {
            // New appointment ends during existing appointment
            AND: [
              { scheduledAt: { gte: scheduledAt } },
              { scheduledAt: { lt: endTime } },
            ],
          },
        ],
      },
    });

    return conflicts.length > 0;
  }

  private async generateTimeSlots(
    professionalId: string,
    date: Date,
    openTime: string,
    closeTime: string,
    slotDuration: number
  ): Promise<any[]> {
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    const slots: any[] = [];
    let currentTime = new Date(date);
    currentTime.setHours(openHour, openMin, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(closeHour, closeMin, 0, 0);

    // Get existing appointments for the day
    const appointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        scheduledAt: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
      },
      select: {
        scheduledAt: true,
        duration: true,
      },
    });

    while (isBefore(currentTime, endTime)) {
      const slotEnd = addMinutes(currentTime, slotDuration);

      // Check if slot conflicts with any appointment
      const hasConflict = appointments.some((appt) => {
        const apptEnd = addMinutes(new Date(appt.scheduledAt), appt.duration);
        return (
          (isBefore(currentTime, apptEnd) && isAfter(slotEnd, new Date(appt.scheduledAt))) ||
          currentTime.getTime() === new Date(appt.scheduledAt).getTime()
        );
      });

      slots.push({
        time: currentTime.toISOString(),
        available: !hasConflict && isAfter(currentTime, new Date()),
      });

      currentTime = addMinutes(currentTime, slotDuration);
    }

    return slots;
  }

  private async scheduleReminder(appointmentId: string, scheduledAt: Date): Promise<void> {
    const reminderTime = new Date(scheduledAt);
    reminderTime.setHours(reminderTime.getHours() - 24); // 24 hours before

    // Only schedule if reminder time is in the future
    if (isAfter(reminderTime, new Date())) {
      // Store in Redis with expiration
      const delay = reminderTime.getTime() - Date.now();
      
      await redis.setex(
        `appointment:reminder:${appointmentId}`,
        Math.floor(delay / 1000),
        JSON.stringify({ appointmentId, scheduledAt })
      );

      logger.info('Reminder scheduled', { appointmentId, reminderTime });
    }
  }
}