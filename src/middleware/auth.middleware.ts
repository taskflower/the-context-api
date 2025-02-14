import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { UserService } from '../services/user/user.service';
import { ApiError, ErrorCodes } from '../errors/errors.utilsts';

const userService = new UserService();

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(
        401,
        'Missing authorization token',
        ErrorCodes.UNAUTHORIZED
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add or update user in the database
    await userService.addOrUpdateUser(decodedToken);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(
      401,
      'Invalid or expired token',
      ErrorCodes.UNAUTHORIZED,
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
};