// src/services/googleads/googleads.debug.ts
import { Router, Request, Response, NextFunction } from 'express';
import { GoogleAdsApi } from 'google-ads-api';

const debugRouter = Router();

// Użyj prostszej składni lub RequestHandler
debugRouter.get('/', function(req: Request, res: Response, next: NextFunction) {
  // Zawiń zawartość w funkcję asynchroniczną
  (async () => {
    try {
      // Wypisz informacje o zmiennych środowiskowych (ukrywając pełne wartości dla bezpieczeństwa)
      const envInfo = {
        CLIENT_ID: process.env.GOOGLE_ADS_CLIENT_ID ? 
          `${process.env.GOOGLE_ADS_CLIENT_ID.substring(0, 5)}...` : 'nie ustawione',
        CLIENT_SECRET: process.env.GOOGLE_ADS_CLIENT_SECRET ? 
          `${process.env.GOOGLE_ADS_CLIENT_SECRET.substring(0, 5)}...` : 'nie ustawione',
        DEVELOPER_TOKEN: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? 
          `${process.env.GOOGLE_ADS_DEVELOPER_TOKEN.substring(0, 5)}...` : 'nie ustawione',
        REFRESH_TOKEN: process.env.GOOGLE_ADS_REFRESH_TOKEN ? 
          `${process.env.GOOGLE_ADS_REFRESH_TOKEN.substring(0, 5)}...` : 'nie ustawione',
        CUSTOMER_ID: process.env.GOOGLE_ADS_CUSTOMER_ID || 'nie ustawione'
      };

      console.log('Zmienne środowiskowe Google Ads:', envInfo);

      if (!process.env.GOOGLE_ADS_CLIENT_ID || 
          !process.env.GOOGLE_ADS_CLIENT_SECRET || 
          !process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 
          !process.env.GOOGLE_ADS_REFRESH_TOKEN || 
          !process.env.GOOGLE_ADS_CUSTOMER_ID) {
        return res.status(500).json({
          success: false,
          message: 'Brakujące zmienne środowiskowe Google Ads API',
          missingVars: Object.entries(envInfo)
            .filter(([_, value]) => value === 'nie ustawione')
            .map(([key]) => key)
        });
      }

      // Inicjalizacja Google Ads API z dodatkowym logowaniem
      console.log('Inicjalizacja Google Ads API...');
      const googleAdsApi = new GoogleAdsApi({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
        developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
      });
      console.log('Google Ads API pomyślnie zainicjalizowane');

      // Szczegółowa inicjalizacja klienta z dodatkowym logowaniem
      console.log(`Tworzenie klienta dla ID klienta: ${process.env.GOOGLE_ADS_CUSTOMER_ID}`);
      const customer = googleAdsApi.Customer({
        customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
        login_customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID // dodane dla pewności
      });
      console.log('Klient pomyślnie utworzony');

      // Zamiast pełnego zapytania, spróbujmy najprostszego możliwego
      console.log('Wykonywanie prostego zapytania...');
      const testQuery = await customer.query(`
        SELECT customer.id FROM customer LIMIT 1
      `);
      console.log('Zapytanie zakończone pomyślnie, wynik:', testQuery);

      return res.status(200).json({
        success: true,
        message: 'Połączenie z Google Ads API działa poprawnie',
        data: {
          envInfo,
          queryResult: testQuery
        }
      });
    } catch (error: any) {
      console.error('Google Ads API debug error:', error);
      
      // Szczegółowa analiza błędu
      const errorDetails = {
        message: error.message || 'Brak komunikatu błędu',
        name: error.name || 'Nieznany błąd',
        stack: error.stack || 'Brak stosu wywołań',
        details: error.details || 'brak',
        code: error.code || 'brak',
        status: error.status || 'brak',
        response: error.response ? {
          status: error.response.status || 'brak',
          statusText: error.response.statusText || 'brak',
          data: error.response.data || 'brak'
        } : 'brak'
      };

      return res.status(500).json({
        success: false,
        message: 'Błąd debugowania Google Ads API',
        error: errorDetails
      });
    }
  })().catch(next); // Przechwytuj błędy i przekazuj do następnego middleware
});

export default debugRouter;