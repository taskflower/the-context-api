// src/middleware/error.middleware.ts
import { ApiError, ErrorCodes } from '../errors/errors.utilsts';
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

// Custom error interfaces
interface RateLimitError extends Error {
  name: string;
  retryAfter?: number;
}

interface FirebaseError extends Error {
  code?: string;
}

export const errorHandler: ErrorRequestHandler = (
  err: Error | ApiError | RateLimitError | FirebaseError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[${new Date().toISOString()}] Error:`, err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message,
        details: err.details || null
      }
    });
    return;
  }

  // Rate limiter error handling
  if (err.name === 'RateLimitExceeded') {
    const rateLimitError = err as RateLimitError;
    res.status(429).json({
      success: false,
      error: {
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests. Please try again later.',
        details: {
          retryAfter: rateLimitError.retryAfter || 900 // 15 minutes default
        }
      }
    });
    return;
  }

  // Firebase error handling
  if (err.name === 'FirebaseError') {
    const firebaseError = err as FirebaseError;
    const isAuthError = firebaseError.code?.startsWith('auth/');
    
    res.status(isAuthError ? 401 : 500).json({
      success: false,
      error: {
        code: isAuthError ? ErrorCodes.FIREBASE_AUTH_ERROR : ErrorCodes.FIREBASE_DB_ERROR,
        message: firebaseError.message,
        details: process.env.NODE_ENV === 'development' ? {
          code: firebaseError.code,
          originalError: firebaseError.message
        } : null
      }
    });
    return;
  }

  // Generic error handling
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    }
  });
};