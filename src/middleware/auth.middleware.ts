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
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      
      // Move user creation/update to a separate try-catch to prevent
      // authentication failures when user db operations fail
      try {
        // Add or update user in the database
        await userService.addOrUpdateUser(decodedToken);
      } catch (userError) {
        // Log the error but continue with the authenticated request
        console.error('User update error during authentication:', userError);
        // We don't reject the request here, just log the error
      }
      
      next();
    } catch (firebaseError) {
      // This is specifically for token verification errors
      console.error('Token verification error:', firebaseError);
      throw new ApiError(
        401,
        'Invalid or expired token',
        ErrorCodes.UNAUTHORIZED,
        process.env.NODE_ENV === 'development' ? firebaseError : undefined
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(
      401,
      'Authentication failed',
      ErrorCodes.UNAUTHORIZED,
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
};