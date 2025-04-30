// src/services/googleads/googleads.service.ts
import { ApiError, ErrorCodes } from '../../errors/errors.utilsts';
import { GoogleAdsApi } from 'google-ads-api';

export class GoogleAdsService {
  private googleAdsApi: GoogleAdsApi;
  public defaultRefreshToken: string;
  public defaultCustomerId: string;

  constructor() {
    // Upewnij się, że zmienne środowiskowe są poprawnie ustawione
    if (!process.env.GOOGLE_ADS_CLIENT_ID || 
        !process.env.GOOGLE_ADS_CLIENT_SECRET || 
        !process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 
        !process.env.GOOGLE_ADS_REFRESH_TOKEN || 
        !process.env.GOOGLE_ADS_CUSTOMER_ID) {
      console.error('Brakujące wymagane zmienne środowiskowe Google Ads');
    }

    this.defaultRefreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
    this.defaultCustomerId = process.env.GOOGLE_ADS_CUSTOMER_ID || '';

    // Inicjalizacja Google Ads API
    this.googleAdsApi = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || ''
    });
  }

  /**
   * Pobierz klienckiego klienta dla Google Ads API używając domyślnych wartości
   */
  getCustomerClient() {
    try {
      // Zabezpieczenie przed brakiem danych
      if (!this.defaultCustomerId || !this.defaultRefreshToken) {
        throw new Error('Brak wymaganych poświadczeń Google Ads');
      }

      return this.googleAdsApi.Customer({
        customer_id: this.defaultCustomerId,
        refresh_token: this.defaultRefreshToken,
        login_customer_id: this.defaultCustomerId // Często pomaga przy błędach autoryzacji
      });
    } catch (error) {
      console.error('Błąd podczas tworzenia klienta Google Ads:', error);
      throw error;
    }
  }

  /**
   * Sprawdza dostępne konta klienta (przydatne do weryfikacji poświadczeń)
   */
  async checkAccess() {
    try {
      // Ta metoda nie wymaga customer_id, więc może być użyta do weryfikacji
      const accessibleCustomers = await this.googleAdsApi.listAccessibleCustomers(
        this.defaultRefreshToken
      );
      return accessibleCustomers;
    } catch (error: any) {
      console.error('Błąd podczas sprawdzania dostępu do Google Ads:', error);
      throw new ApiError(
        500,
        `Błąd autoryzacji Google Ads: ${error.message || 'Nieznany błąd'}`,
        ErrorCodes.EXTERNAL_API_ERROR,
        error
      );
    }
  }

  /**
   * Utwórz testową kampanię w Google Ads
   */
  async createTestCampaign(campaignName?: string) {
    try {
      // Użyj domyślnej nazwy kampanii, jeśli nie została podana
      const name = campaignName || `Testowa kampania ${new Date().toISOString().split('T')[0]}`;
      
      const customer = this.getCustomerClient();
      
      // Utwórz budżet kampanii
      const budgetResponse = await customer.campaignBudgets.create([{
        name: `${name} Budget`,
        amount_micros: 500000000, // 500 USD
        delivery_method: 'STANDARD',
      }]);
      
      const budget = budgetResponse.results?.[0]?.resource_name;
      
      if (!budget) {
        throw new Error('Nie udało się utworzyć budżetu kampanii');
      }
      
      // Utwórz kampanię
      const campaignResponse = await customer.campaigns.create([{
        name: name,
        campaign_budget: budget,
        advertising_channel_type: 'SEARCH',
        status: 'PAUSED', // Zawsze twórz jako PAUSED dla bezpieczeństwa
        start_date: new Date().toISOString().slice(0,10).replace(/-/g, ''),
      }]);
      
      const campaign = campaignResponse.results?.[0]?.resource_name;
      
      if (!campaign) {
        throw new Error('Nie udało się utworzyć kampanii');
      }
      
      // Utwórz grupę reklam
      const adGroupResponse = await customer.adGroups.create([{
        campaign,
        name: `${name} AdGroup`,
        type: 'SEARCH_STANDARD',
        status: 'PAUSED',
      }]);
      
      const adGroup = adGroupResponse.results?.[0]?.resource_name;
      
      if (!adGroup) {
        throw new Error('Nie udało się utworzyć grupy reklam');
      }
      
      // Utwórz reklamę tekstową rozszerzoną
      const adResponse = await customer.adGroupAds.create([{
        ad_group: adGroup,
        ad: {
          final_urls: ['http://example.com'],
          expanded_text_ad: {
            headline_part1: `${name} Headline`,
            headline_part2: 'API Test',
            description: 'Testowanie integracji Google Ads API',
          },
        },
        status: 'PAUSED',
      }]);
      
      const ad = adResponse.results?.[0]?.resource_name;
      
      if (!ad) {
        throw new Error('Nie udało się utworzyć reklamy');
      }
      
      return {
        budget,
        campaign,
        adGroup,
        ad
      };
    } catch (error: any) {
      console.error('Google Ads API error:', error);
      throw new ApiError(
        500,
        `Nie udało się utworzyć kampanii testowej: ${error.message || 'Nieznany błąd'}`,
        ErrorCodes.EXTERNAL_API_ERROR,
        error
      );
    }
  }

  /**
   * Pobierz listę kampanii dla klienta
   */
  async getCampaigns() {
    try {
      const customer = this.getCustomerClient();
      
      // Użyj search zamiast list
      const campaigns = await customer.query(`
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type
        FROM campaign
        ORDER BY campaign.id
      `);
      
      return campaigns;
    } catch (error: any) {
      console.error('Google Ads API error:', error);
      throw new ApiError(
        500,
        `Nie udało się pobrać kampanii: ${error.message || 'Nieznany błąd'}`,
        ErrorCodes.EXTERNAL_API_ERROR,
        error
      );
    }
  }

  /**
   * Pobierz informacje o koncie
   */
  async getAccountInfo() {
    try {
      const customer = this.getCustomerClient();
      
      // Użyj search zamiast list
      const customerInfo = await customer.query(`
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code
        FROM customer
        WHERE customer.id = ${this.defaultCustomerId}
      `);
      
      return customerInfo;
    } catch (error: any) {
      console.error('Google Ads API error:', error);
      throw new ApiError(
        500,
        `Nie udało się pobrać informacji o koncie: ${error.message || 'Nieznany błąd'}`,
        ErrorCodes.EXTERNAL_API_ERROR,
        error
      );
    }
  }
}

export const googleAdsService = new GoogleAdsService();