// src/services/googleads/googleads.routes.ts
import { Router, Response, Request } from 'express';
import { googleAdsService } from './googleads.service';
const router = Router();

router.get('/direct-test', (req: Request, res: Response) => {
  (async () => {
    try {
      console.log('Rozpoczynam test bezpośredniego dostępu do Google Ads API');
      
      const { hasMissing, missingVars } = googleAdsService.validateEnvVars();
      
      if (hasMissing) {
        console.error('Brakujące zmienne środowiskowe!');
        return res.status(500).json({
          success: false,
          message: 'Brakujące zmienne środowiskowe Google Ads',
          missingVars
        });
      }
      
      // Używamy zmiennych z zapytania, jeśli dostępne, lub z env
      const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
      
      const accessibleCustomers = await googleAdsService.checkAccess(refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Autoryzacja Google Ads API działa poprawnie',
        data: { accessibleCustomers }
      });
    } catch (error: any) {
      console.error('Błąd podczas testu Google Ads API:', error);
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

router.get('/campaigns', (req: Request, res: Response) => {
  (async () => {
    try {
      console.log('Pobieranie kampanii Google Ads');
      
      // Używamy zmiennych z env
      const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
      const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
      const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
      
      console.log(`Wartości dla Google Ads: refreshToken=${!!refreshToken}, customerId=${customerId}, loginCustomerId=${loginCustomerId}`);
      if (!refreshToken || !customerId) {
        console.error(`Brak danych: refreshToken=${!!refreshToken}, customerId=${!!customerId}`);
        return res.status(400).json({
          success: false,
          message: 'Brakuje tokenu odświeżania lub ID klienta',
          details: {
            hasRefreshToken: !!refreshToken,
            hasCustomerId: !!customerId
          }
        });
      }
      
      const campaigns = await googleAdsService.getCampaigns(
        refreshToken, 
        customerId, 
        loginCustomerId
      );
      
      res.status(200).json({
        success: true,
        message: 'Kampanie pobrane pomyślnie',
        data: { campaigns }
      });
    } catch (error: any) {
      console.error('Błąd podczas pobierania kampanii Google Ads:', error);
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

export default router;