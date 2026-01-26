import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * MIDAS: Role-Based Access Control
 * Ensures users have the required role to access a resource.
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
    }

    next();
  };
};

/**
 * MIDAS: Tier-Based Access Control
 * Ensures professionals have the required subscription tier for premium features.
 */
export const requireTier = (minTier: 'free' | 'basic' | 'pro' | 'enterprise') => {
  const tiers = ['free', 'basic', 'pro', 'enterprise'];
  const minTierIndex = tiers.indexOf(minTier);

  return async (req: Request, res: Response, next: NextFunction) => {
    // This would typically involve fetching the professional profile associated with the user
    // For now, we demonstrate the pattern as an extensible middleware.

    // Placeholder logic: In a real scenario, we'd fetch req.user.professional.subscriptionTier
    const userTier = 'free'; // Default for example
    const userTierIndex = tiers.indexOf(userTier);

    if (userTierIndex < minTierIndex) {
      return next(new AppError(402, 'PAYMENT_REQUIRED', `This feature requires a ${minTier} subscription`));
    }

    next();
  };
};
