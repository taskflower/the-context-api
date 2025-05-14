// src/services/googleads/types/customer.types.ts
import { GoogleAdsApi, Customer } from 'google-ads-api';

/**
 * Wspólne opcje dla metod używane w całym API
 */
export interface CommonOptions {
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string;
}

/**
 * Interfejs do walidacji zmiennych środowiskowych
 */
export interface EnvValidationResult {
  hasMissing: boolean;
  missingVars: {
    [key: string]: boolean;
  };
}