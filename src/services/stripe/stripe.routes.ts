// src/services/stripe/stripe.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { AuthRequest, verifyToken } from '../../middleware/auth.middleware';
import { stripeService } from './stripe.service';
import { ApiError, ErrorCodes } from '../../errors/errors.utilsts';

const router = Router();

// Wrap async route handlers to properly catch errors
const asyncHandler = (fn: Function) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create checkout session for token purchase
router.post('/create-checkout-session', 
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { tokenAmount } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        throw new ApiError(
          401,
          'User authentication required',
          ErrorCodes.UNAUTHORIZED
        );
      }

      if (!tokenAmount || tokenAmount <= 0 || !Number.isInteger(tokenAmount)) {
        throw new ApiError(
          400,
          'Token amount must be a positive integer',
          ErrorCodes.INVALID_INPUT
        );
      }

      const checkoutUrl = await stripeService.createCheckoutSession(userId, tokenAmount);

      res.status(200).json({
        success: true,
        data: {
          checkoutUrl
        }
      });
    } catch (error) {
      next(error);
    }
  })
);

// Verify payment session status
router.get('/verify-session/:sessionId', 
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.uid;

      if (!userId) {
        throw new ApiError(
          401,
          'User authentication required',
          ErrorCodes.UNAUTHORIZED
        );
      }

      if (!sessionId) {
        throw new ApiError(
          400,
          'Session ID is required',
          ErrorCodes.INVALID_INPUT
        );
      }

      const sessionStatus = await stripeService.verifyPaymentSession(sessionId, userId);

      res.status(200).json({
        success: true,
        data: sessionStatus
      });
    } catch (error) {
      next(error);
    }
  })
);

// Stripe webhook handler - doesn't use verifyToken as it's called by Stripe
router.post('/webhook', 
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        throw new ApiError(
          400,
          'Missing Stripe signature',
          ErrorCodes.INVALID_INPUT
        );
      }

      // Access the raw request body buffer
      const payload = req.body;
      
      await stripeService.handleWebhook(signature, payload);
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      // Don't expose error details to Stripe
      res.status(400).json({ received: false });
    }
  })
);

// Add GET endpoint for webhook testing/verification
router.get('/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Stripe webhook endpoint is active. Please use POST method for actual webhook events.'
    });
  })
);

// Get user purchase history
router.get('/purchase-history',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        throw new ApiError(
          401,
          'User authentication required',
          ErrorCodes.UNAUTHORIZED
        );
      }

      const purchaseHistory = await stripeService.getPurchaseHistory(userId);

      res.status(200).json({
        success: true,
        data: {
          purchases: purchaseHistory
        }
      });
    } catch (error) {
      next(error);
    }
  })
);

export default router;