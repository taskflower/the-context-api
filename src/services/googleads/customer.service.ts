// src/services/googleads/customer.service.ts
import { GoogleAdsApi, Customer } from 'google-ads-api';
import { CommonOptions } from './customer.types';


export class CustomerService {
  private googleAdsApi: GoogleAdsApi;
  
  constructor(
    private clientId: string,
    private clientSecret: string,
    private developerToken: string
  ) {
    this.googleAdsApi = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken
    });
  }

  async checkAccess(refreshToken: string) {
    try {
      return await this.googleAdsApi.listAccessibleCustomers(refreshToken);
    } catch (error) {
      console.error('Błąd podczas sprawdzania dostępu:', error);
      throw error;
    }
  }

  // Metoda pomocnicza do tworzenia obiektu Customer
  getCustomer({ refreshToken, customerId, loginCustomerId }: CommonOptions): Customer {
    const customerOptions: any = {
      customer_id: customerId,
      refresh_token: refreshToken
    };
    
    if (loginCustomerId) {
      customerOptions.login_customer_id = loginCustomerId;
      console.log('Używam konta menedżera (MCC) z login_customer_id:', loginCustomerId);
    }
    
    return this.googleAdsApi.Customer(customerOptions);
  }

  validateEnvVars() {
    const missingVars = {
      clientId: !this.clientId,
      clientSecret: !this.clientSecret,
      developerToken: !this.developerToken
    };
    
    const hasMissing = Object.values(missingVars).some(missing => missing);
    return { hasMissing, missingVars };
  }
}