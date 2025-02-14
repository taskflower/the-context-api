// src/middleware/token-usage.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UserService } from '../services/user/user.service';
import { ApiError, ErrorCodes } from '../errors/errors.utilsts';

const userService = new UserService();

interface TokenUsageOptions {
  skipCheck?: boolean;
}

export const permanentTokenConsumption = (tokenCost: number = 0, options: TokenUsageOptions = {}) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (tokenCost === 0) {
        return next();
      }

      const userId = req.user?.uid;

      if (!userId) {
        throw new ApiError(
          401,
          'User authentication required',
          ErrorCodes.UNAUTHORIZED
        );
      }

      if (options.skipCheck) {
        return next();
      }

      const availableTokens = await userService.checkAvailableTokens(userId);
      
      if (availableTokens < tokenCost) {
        throw new ApiError(
          403,
          'Insufficient tokens to perform this operation',
          ErrorCodes.INSUFFICIENT_TOKENS,
          {
            required: tokenCost,
            available: availableTokens
          }
        );
      }

      const success = await userService.registerTokenUsage(userId, tokenCost);
      
      if (!success) {
        throw new ApiError(
          500,
          'Failed to process token usage',
          ErrorCodes.INTERNAL_ERROR
        );
      }

      // Rzutowanie na "any" by nadpisać metodę json bez błędów typów
      const originalJson = res.json.bind(res);
      (res as any).json = function (body: any) {
        const newBody = {
          ...body,
          tokenUsage: {
            cost: tokenCost,
            remaining: availableTokens - tokenCost
          }
        };
        return originalJson(newBody);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
