// src/utils/errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ErrorCodes = {
  // Auth & permissions
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_TOKENS: 'INSUFFICIENT_TOKENS',
  
  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Firebase specific
  FIREBASE_AUTH_ERROR: 'FIREBASE_AUTH_ERROR',
  FIREBASE_DB_ERROR: 'FIREBASE_DB_ERROR',
  
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;