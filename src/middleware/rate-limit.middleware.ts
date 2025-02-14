// src/middleware/rate-limit.middleware.ts
import { ApiError, ErrorCodes } from '../errors/errors.utilsts';
import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './error.middleware';

export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100 // maximum number of requests
) => {
  return rateLimit({
    windowMs,
    max,
    handler: (req: Request, res: Response) => {
      const error = new ApiError(
        429,
        'Too many requests. Please try again later.',
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        { retryAfter: Math.ceil(windowMs / 1000) }
      );
      errorHandler(error, req, res, () => {});
    }
  });
};