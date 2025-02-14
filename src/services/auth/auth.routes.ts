// src/services/auth/auth.routes.ts
import { Router, Response } from 'express';
import { AuthRequest, verifyToken } from '../../middleware/auth.middleware';
import { UserService } from '../user/user.service';
import { permanentTokenConsumption } from '../../middleware/token-usage.middleware';

const router = Router();
const userService = new UserService();

router.get('/protected', 
  verifyToken, 
  permanentTokenConsumption(), // No cost specified - defaults to 0
  (req: AuthRequest, res: Response) => {
    res.json({ 
      message: 'Access granted',
      user: req.user 
    });
});

router.get('/status', 
  verifyToken,
  permanentTokenConsumption(), // No cost specified - defaults to 0
  (req: AuthRequest, res: Response) => {
    res.json({
      authenticated: true,
      user: req.user
    });
});

router.post('/login', 
  verifyToken, 
  permanentTokenConsumption(1), // Direct token cost value
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const decodedToken = req.user;
      if (!decodedToken) {
        res.status(401).json({ error: 'No user token' });
        return;
      }

      await userService.addOrUpdateUser(decodedToken);

      res.status(200).json({
        message: 'User registered/updated successfully',
        user: decodedToken
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error during login'
      });
    }
});

export default router;