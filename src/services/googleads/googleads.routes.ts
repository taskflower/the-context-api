// src/services/googleads/googleads.routes.ts
import { Router, Response, NextFunction, Request } from 'express';
import { AuthRequest, verifyToken } from '../../middleware/auth.middleware';
import { googleAdsService } from './googleads.service';
import { ApiError, ErrorCodes } from '../../errors/errors.utilsts';
import { GoogleAdsApi } from 'google-ads-api';

const router = Router();

// Najprostsze podejście - używamy funkcji bezpośrednio w routerze
router.get('/direct-test', (req: Request, res: Response) => {
  (async () => {
    try {
      console.log('Rozpoczynam test bezpośredniego dostępu do Google Ads API');
      
      // Sprawdzenie zmiennych środowiskowych
      if (!process.env.GOOGLE_ADS_CLIENT_ID || 
          !process.env.GOOGLE_ADS_CLIENT_SECRET || 
          !process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 
          !process.env.GOOGLE_ADS_REFRESH_TOKEN || 
          !process.env.GOOGLE_ADS_CUSTOMER_ID) {
        console.error('Brakujące zmienne środowiskowe!');
        return res.status(500).json({
          success: false,
          message: 'Brakujące zmienne środowiskowe Google Ads',
          missingVars: {
            clientId: !process.env.GOOGLE_ADS_CLIENT_ID,
            clientSecret: !process.env.GOOGLE_ADS_CLIENT_SECRET,
            developerToken: !process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
            refreshToken: !process.env.GOOGLE_ADS_REFRESH_TOKEN,
            customerId: !process.env.GOOGLE_ADS_CUSTOMER_ID
          }
        });
      }
      
      console.log('Inicjalizacja bezpośredniego połączenia z Google Ads API');
      
      // Bezpośrednia inicjalizacja klienta
      const googleAdsApi = new GoogleAdsApi({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN
      });
      
      console.log('Inicjalizacja API udana, teraz sprawdzam dostęp do kont');
      
      // Ten endpoint nie wymaga customer_id, więc jest dobrym testem autoryzacji
      const accessibleCustomers = await googleAdsApi.listAccessibleCustomers(
        process.env.GOOGLE_ADS_REFRESH_TOKEN || ''
      );
      
      console.log('Uzyskano dostęp do kont Google Ads:', accessibleCustomers);
      
      // Jeśli udało się pobrać dostępne konta, autoryzacja działa
      res.status(200).json({
        success: true,
        message: 'Autoryzacja Google Ads API działa poprawnie',
        data: {
          accessibleCustomers
        }
      });
    } catch (error: any) {
      console.error('Błąd podczas bezpośredniego testu Google Ads API:', error);
      res.status(500).json({
        success: false,
        message: `Błąd Google Ads API: ${error.message || 'Nieznany błąd'}`,
        error: {
          message: error.message,
          stack: error.stack,
          details: error.details || 'brak szczegółów'
        }
      });
    }
  })().catch(err => {
    console.error('Nieobsłużony błąd:', err);
    res.status(500).json({ error: 'Nieoczekiwany błąd serwera' });
  });
});

// Test connection and authorization - nie wymaga autentykacji JWT
router.get('/test-connection', (req: Request, res: Response) => {
  (async () => {
    try {
      console.log('Sprawdzanie dostępu do Google Ads API przez serwis');
      const accessibleCustomers = await googleAdsService.checkAccess();
      
      res.status(200).json({
        success: true,
        message: 'Połączenie z Google Ads API działa poprawnie',
        data: {
          accessibleCustomers
        }
      });
    } catch (error: any) {
      console.error('Google Ads API connection test error:', error);
      res.status(500).json({
        success: false,
        message: `Błąd połączenia z Google Ads API: ${error.message}`,
        error: error.message
      });
    }
  })().catch(err => {
    console.error('Nieobsłużony błąd:', err);
    res.status(500).json({ error: 'Nieoczekiwany błąd serwera' });
  });
});

// Wrap async route handlers to properly catch errors
const asyncHandler = (fn: Function) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create a test campaign - nie wymaga podania customerId ani refreshToken
router.post('/create-test-campaign',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { campaignName } = req.body || {};
      const userId = req.user?.uid;

      if (!userId) {
        throw new ApiError(
          401,
          'User authentication required',
          ErrorCodes.UNAUTHORIZED
        );
      }

      const result = await googleAdsService.createTestCampaign(campaignName);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  })
);

// Get campaigns for a customer - nie wymaga podania customerId ani refreshToken
router.get('/get-campaigns', 
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

      const campaigns = await googleAdsService.getCampaigns();

      res.status(200).json({
        success: true,
        data: {
          campaigns
        }
      });
    } catch (error) {
      next(error);
    }
  })
);

// Pozostawiona implementacja POST - nie wymaga podania customerId ani refreshToken
router.post('/get-campaigns',
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

      const campaigns = await googleAdsService.getCampaigns();

      res.status(200).json({
        success: true,
        data: {
          campaigns
        }
      });
    } catch (error) {
      next(error);
    }
  })
);

// Get account information - nie wymaga podania customerId ani refreshToken
router.get('/get-account-info',
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

      const accountInfo = await googleAdsService.getAccountInfo();

      res.status(200).json({
        success: true,
        data: {
          accountInfo
        }
      });
    } catch (error) {
      next(error);
    }
  })
);

// Implementacja POST dla get-account-info - nie wymaga podania customerId ani refreshToken
router.post('/get-account-info',
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

      const accountInfo = await googleAdsService.getAccountInfo();

      res.status(200).json({
        success: true,
        data: {
          accountInfo
        }
      });
    } catch (error) {
      next(error);
    }
  })
);

export default router;