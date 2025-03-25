// src/services/auth/auth.routes.ts
import { Router, Response, NextFunction } from 'express';
import { AuthRequest, verifyToken } from '../../middleware/auth.middleware';
import { UserService } from '../user/user.service';
import { permanentTokenConsumption } from '../../middleware/token-usage.middleware';
import { ApiError, ErrorCodes } from '../../errors/errors.utilsts';

const router = Router();
const userService = new UserService();

// Wrap async route handlers to properly catch errors
const asyncHandler = (fn: Function) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

router.get('/protected', 
  verifyToken, 
  permanentTokenConsumption(), // No cost specified - defaults to 0
  (req: AuthRequest, res: Response) => {
    res.json({ 
      success: true,
      data: {
        message: 'Access granted',
        user: req.user 
      }
    });
});

router.get('/status', 
  verifyToken,
  permanentTokenConsumption(), // No cost specified - defaults to 0
  (req: AuthRequest, res: Response) => {
    res.json({
      success: true,
      data: {
        authenticated: true,
        user: req.user
      }
    });
});

router.post('/login', 
  verifyToken, 
  permanentTokenConsumption(1), // Direct token cost value
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const decodedToken = req.user;
    
    if (!decodedToken) {
      throw new ApiError(
        401,
        'No user token',
        ErrorCodes.UNAUTHORIZED
      );
    }
    
    // This should already be done in verifyToken middleware,
    // but add a safeguard here as well
    try {
      await userService.addOrUpdateUser(decodedToken);
    } catch (error) {
      console.error('Additional user update error during login:', error);
      // Don't fail the request if this secondary update fails
    }
    
    res.status(200).json({
      success: true,
      data: {
        message: 'User authenticated successfully',
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          // Only include safe user properties
        }
      }
    });
  })
);

export default router;