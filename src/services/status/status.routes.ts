// src/services/status/status.routes.ts
import { Router } from 'express';
import { StatusService } from './status.service';
import { ApiError, ErrorCodes } from '../../errors/errors.utilsts';

const router = Router();
const statusService = new StatusService();

// App version from main app
let APP_VERSION = '1.0.1';

// Set app version (called from main app)
export const setAppVersion = (version: string): void => {
  APP_VERSION = version;
};

// Health check endpoint
router.get('/health', (req, res) => {
  const healthStatus = statusService.getHealthStatus();
  res.json({
    success: true,
    data: healthStatus
  });
});

// Firebase status endpoint
router.get('/firebase', async (req, res, next) => {
  try {
    const firebaseStatus = await statusService.getFirebaseStatus(APP_VERSION);
    
    res.json({
      success: true,
      data: firebaseStatus
    });
  } catch (error) {
    next(new ApiError(
      500,
      'Error checking Firebase status',
      ErrorCodes.SERVICE_UNAVAILABLE,
      process.env.NODE_ENV === 'development' ? error : undefined
    ));
  }
});

export default router;