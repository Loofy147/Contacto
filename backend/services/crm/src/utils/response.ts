import { Response } from 'express';

/**
 * PALLETTE: Standardized Success Response
 * Ensures all API success responses follow a consistent format.
 */
export const sendSuccess = (res: Response, data: any, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * PALLETTE: Standardized Error Response
 * (Note: The global errorHandler uses a similar pattern,
 * this utility can be used for manual error sending if needed)
 */
export const sendError = (res: Response, code: string, message: string, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
  });
};
