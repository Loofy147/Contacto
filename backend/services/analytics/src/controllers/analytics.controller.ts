// backend/services/analytics/src/controllers/analytics.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AnalyticsController {
  /**
   * Get dashboard overview metrics
   */
  getDashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { timeRange = '30d' } = req.query;

      // Get professional profile
      const professional = await prisma.professional.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional profile not found');
      }

      // Check cache
      const cacheKey = `analytics:overview:${professional.id}:${timeRange}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
        });
      }

      const days = this.parseDays(timeRange as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Parallel queries for better performance
      const [
        totalViews,
        totalPhoneClicks,
        totalWebsiteClicks,
        totalReviews,
        averageRating,
        appointments,
        viewsOverTime,
      ] = await Promise.all([
        this.getTotalViews(professional.id, startDate),
        this.getTotalPhoneClicks(professional.id, startDate),
        this.getTotalWebsiteClicks(professional.id, startDate),
        this.getTotalReviews(professional.id, startDate),
        this.getAverageRating(professional.id, startDate),
        this.getAppointments(professional.id, startDate),
        this.getViewsOverTime(professional.id, startDate),
      ]);

      const overview = {
        summary: {
          totalViews,
          totalPhoneClicks,
          totalWebsiteClicks,
          totalReviews,
          averageRating,
          totalAppointments: appointments.length,
          conversionRate: totalViews > 0 ? ((totalPhoneClicks + appointments.length) / totalViews * 100).toFixed(2) : 0,
        },
        charts: {
          viewsOverTime,
          appointmentsByStatus: this.groupAppointmentsByStatus(appointments),
          reviewsDistribution: await this.getReviewsDistribution(professional.id, startDate),
        },
        recentActivity: await this.getRecentActivity(professional.id, 10),
      };

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(overview));

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get detailed sales analytics
   */
  getSalesAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { startDate, endDate, groupBy = 'day' } = req.query;

      const professional = await prisma.professional.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional profile not found');
      }

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      // Get sales data from database
      const sales = await prisma.$queryRaw`
        SELECT
          DATE_TRUNC(${groupBy}, created_at) AS date,
          COUNT(*) AS transaction_count,
          SUM(total_amount) AS total_revenue,
          AVG(total_amount) AS avg_transaction_value,
          COUNT(DISTINCT customer_id) AS unique_customers
        FROM transactions
        WHERE professional_id = ${professional.id}
          AND created_at >= ${start}
          AND created_at <= ${end}
          AND status = 'completed'
        GROUP BY DATE_TRUNC(${groupBy}, created_at)
        ORDER BY date ASC
      `;

      // Get top products/services
      const topServices = await prisma.$queryRaw`
        SELECT
          s.name,
          COUNT(a.id) AS bookings,
          SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.professional_id = ${professional.id}
          AND a.created_at >= ${start}
          AND a.created_at <= ${end}
        GROUP BY s.id, s.name
        ORDER BY bookings DESC
        LIMIT 10
      `;

      res.json({
        success: true,
        data: {
          salesOverTime: sales,
          topServices,
          summary: {
            totalRevenue: sales.reduce((sum: number, s: any) => sum + Number(s.total_revenue), 0),
            totalTransactions: sales.reduce((sum: number, s: any) => sum + Number(s.transaction_count), 0),
            avgTransactionValue: sales.reduce((sum: number, s: any) => sum + Number(s.avg_transaction_value), 0) / sales.length,
            uniqueCustomers: Math.max(...sales.map((s: any) => Number(s.unique_customers))),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get customer analytics
   */
  getCustomerAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const professional = await prisma.professional.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional profile not found');
      }

      // Customer segmentation
      const customerSegments = await prisma.$queryRaw`
        WITH customer_stats AS (
          SELECT
            customer_id,
            COUNT(*) AS visit_count,
            SUM(total_amount) AS total_spent,
            MAX(created_at) AS last_visit
          FROM transactions
          WHERE professional_id = ${professional.id}
            AND status = 'completed'
          GROUP BY customer_id
        )
        SELECT
          CASE
            WHEN visit_count = 1 THEN 'new'
            WHEN visit_count BETWEEN 2 AND 5 THEN 'regular'
            WHEN visit_count > 5 THEN 'loyal'
          END AS segment,
          COUNT(*) AS customer_count,
          AVG(total_spent) AS avg_lifetime_value
        FROM customer_stats
        GROUP BY segment
      `;

      // Customer retention (month-over-month)
      const retention = await this.calculateRetention(professional.id);

      // Top customers
      const topCustomers = await prisma.$queryRaw`
        SELECT
          c.id,
          c.name,
          COUNT(t.id) AS visit_count,
          SUM(t.total_amount) AS total_spent,
          MAX(t.created_at) AS last_visit
        FROM transactions t
        JOIN customers c ON t.customer_id = c.id
        WHERE t.professional_id = ${professional.id}
          AND t.status = 'completed'
        GROUP BY c.id, c.name
        ORDER BY total_spent DESC
        LIMIT 20
      `;

      res.json({
        success: true,
        data: {
          segments: customerSegments,
          retention,
          topCustomers,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get review analytics
   */
  getReviewAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const professional = await prisma.professional.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional profile not found');
      }

      // Rating distribution
      const ratingDistribution = await prisma.review.groupBy({
        by: ['overallRating'],
        where: {
          professionalId: professional.id,
          isApproved: true,
        },
        _count: true,
      });

      // Review trends over time
      const reviewTrends = await prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', created_at) AS month,
          COUNT(*) AS review_count,
          AVG(overall_rating) AS avg_rating
        FROM reviews
        WHERE professional_id = ${professional.id}
          AND is_approved = true
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `;

      // Sentiment analysis
      const sentimentDistribution = await prisma.review.groupBy({
        by: ['sentimentLabel'],
        where: {
          professionalId: professional.id,
          isApproved: true,
        },
        _count: true,
      });

      // Most common keywords (from review text)
      const commonKeywords = await this.extractCommonKeywords(professional.id);

      res.json({
        success: true,
        data: {
          ratingDistribution,
          reviewTrends,
          sentimentDistribution,
          commonKeywords,
          summary: {
            totalReviews: ratingDistribution.reduce((sum, r) => sum + r._count, 0),
            averageRating: ratingDistribution.reduce((sum, r) => sum + r.overallRating * r._count, 0) / 
                          ratingDistribution.reduce((sum, r) => sum + r._count, 1),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export analytics report
   */
  exportReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { format = 'csv', reportType, startDate, endDate } = req.query;

      const professional = await prisma.professional.findUnique({
        where: { userId },
      });

      if (!professional) {
        throw new AppError(404, 'PROFESSIONAL_NOT_FOUND', 'Professional profile not found');
      }

      // Generate report based on type
      let data: any;
      switch (reportType) {
        case 'sales':
          data = await this.generateSalesReport(professional.id, startDate as string, endDate as string);
          break;
        case 'customers':
          data = await this.generateCustomerReport(professional.id);
          break;
        case 'reviews':
          data = await this.generateReviewsReport(professional.id);
          break;
        default:
          throw new AppError(400, 'INVALID_REPORT_TYPE', 'Invalid report type');
      }

      // Format output
      if (format === 'csv') {
        const csv = this.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${Date.now()}.csv"`);
        res.send(csv);
      } else if (format === 'json') {
        res.json({
          success: true,
          data,
        });
      } else {
        throw new AppError(400, 'INVALID_FORMAT', 'Invalid export format');
      }
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private parseDays(timeRange: string): number {
    const ranges: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '365d': 365,
    };
    return ranges[timeRange] || 30;
  }

  private async getTotalViews(professionalId: string, startDate: Date): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*) as total
      FROM profile_views
      WHERE professional_id = ${professionalId}
        AND created_at >= ${startDate}
    `;
    return Number(result[0]?.total || 0);
  }

  private async getTotalPhoneClicks(professionalId: string, startDate: Date): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*) as total
      FROM click_events
      WHERE professional_id = ${professionalId}
        AND event_type = 'phone_click'
        AND created_at >= ${startDate}
    `;
    return Number(result[0]?.total || 0);
  }

  private async getTotalWebsiteClicks(professionalId: string, startDate: Date): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*) as total
      FROM click_events
      WHERE professional_id = ${professionalId}
        AND event_type = 'website_click'
        AND created_at >= ${startDate}
    `;
    return Number(result[0]?.total || 0);
  }

  private async getTotalReviews(professionalId: string, startDate: Date): Promise<number> {
    return await prisma.review.count({
      where: {
        professionalId,
        isApproved: true,
        createdAt: { gte: startDate },
      },
    });
  }

  private async getAverageRating(professionalId: string, startDate: Date): Promise<number> {
    const result = await prisma.review.aggregate({
      where: {
        professionalId,
        isApproved: true,
        createdAt: { gte: startDate },
      },
      _avg: {
        overallRating: true,
      },
    });
    return result._avg.overallRating || 0;
  }

  private async getAppointments(professionalId: string, startDate: Date): Promise<any[]> {
    return await prisma.appointment.findMany({
      where: {
        professionalId,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });
  }

  private async getViewsOverTime(professionalId: string, startDate: Date): Promise<any[]> {
    const views = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as views
      FROM profile_views
      WHERE professional_id = ${professionalId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    return views as any[];
  }

  private groupAppointmentsByStatus(appointments: any[]): Record<string, number> {
    return appointments.reduce((acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1;
      return acc;
    }, {});
  }

  private async getReviewsDistribution(professionalId: string, startDate: Date): Promise<any[]> {
    const distribution = await prisma.review.groupBy({
      by: ['overallRating'],
      where: {
        professionalId,
        isApproved: true,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    return distribution.map((d) => ({
      rating: d.overallRating,
      count: d._count,
    }));
  }

  private async getRecentActivity(professionalId: string, limit: number): Promise<any[]> {
    // Combine different activity types
    const [views, reviews, appointments] = await Promise.all([
      prisma.$queryRaw`
        SELECT 'view' as type, created_at, NULL as details
        FROM profile_views
        WHERE professional_id = ${professionalId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `,
      prisma.$queryRaw`
        SELECT 'review' as type, created_at, overall_rating as details
        FROM reviews
        WHERE professional_id = ${professionalId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `,
      prisma.$queryRaw`
        SELECT 'appointment' as type, created_at, status as details
        FROM appointments
        WHERE professional_id = ${professionalId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `,
    ]);

    // Merge and sort
    const allActivity = [...(views as any[]), ...(reviews as any[]), ...(appointments as any[])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return allActivity;
  }

  private async calculateRetention(professionalId: string): Promise<any> {
    // Month-over-month retention calculation
    const retention = await prisma.$queryRaw`
      WITH monthly_customers AS (
        SELECT
          DATE_TRUNC('month', created_at) AS month,
          customer_id
        FROM transactions
        WHERE professional_id = ${professionalId}
          AND status = 'completed'
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at), customer_id
      ),
      retention_data AS (
        SELECT
          curr.month,
          COUNT(DISTINCT curr.customer_id) AS customers_this_month,
          COUNT(DISTINCT prev.customer_id) AS returning_customers
        FROM monthly_customers curr
        LEFT JOIN monthly_customers prev
          ON prev.customer_id = curr.customer_id
          AND prev.month = curr.month - INTERVAL '1 month'
        GROUP BY curr.month
      )
      SELECT
        month,
        customers_this_month,
        returning_customers,
        CASE
          WHEN customers_this_month > 0
          THEN (returning_customers::float / customers_this_month * 100)
          ELSE 0
        END AS retention_rate
      FROM retention_data
      ORDER BY month ASC
    `;

    return retention;
  }

  private async extractCommonKeywords(professionalId: string): Promise<string[]> {
    // Simple keyword extraction from reviews
    const reviews = await prisma.review.findMany({
      where: {
        professionalId,
        isApproved: true,
      },
      select: {
        reviewText: true,
      },
    });

    // Combine all review text
    const allText = reviews
      .map((r) => r.reviewText)
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Simple word frequency (in production, use proper NLP library)
    const words = allText.split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    
    const wordCount = words.reduce((acc: Record<string, number>, word) => {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (cleaned.length > 3 && !stopWords.has(cleaned)) {
        acc[cleaned] = (acc[cleaned] || 0) + 1;
      }
      return acc;
    }, {});

    // Get top 10 keywords
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private async generateSalesReport(professionalId: string, startDate: string, endDate: string): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT
        t.id,
        t.transaction_number,
        t.created_at,
        c.name AS customer_name,
        t.total_amount,
        t.payment_method,
        t.status
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.professional_id = ${professionalId}
        AND t.created_at >= ${new Date(startDate)}
        AND t.created_at <= ${new Date(endDate)}
      ORDER BY t.created_at DESC
    `;
  }

  private async generateCustomerReport(professionalId: string): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        COUNT(t.id) AS total_visits,
        SUM(t.total_amount) AS total_spent,
        MAX(t.created_at) AS last_visit,
        MIN(t.created_at) AS first_visit
      FROM customers c
      JOIN transactions t ON c.id = t.customer_id
      WHERE t.professional_id = ${professionalId}
      GROUP BY c.id, c.name, c.email, c.phone
      ORDER BY total_spent DESC
    `;
  }

  private async generateReviewsReport(professionalId: string): Promise<any[]> {
    return await prisma.review.findMany({
      where: {
        professionalId,
        isApproved: true,
      },
      select: {
        id: true,
        overallRating: true,
        reviewText: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}