// src/services/googleads/campaign-budget/campaign-budget.types.ts

import { CommonOptions } from '../customer.types';

/**
 * Interfejs budżetu kampanii
 */
export interface CampaignBudget {
  id: string;
  name: string;
  amount_micros: number;
  amount?: number; // Wartość po konwersji z mikro-jednostek
  status: string;
  delivery_method: string;
  type: string;
}

/**
 * Wynik zapytania dla budżetu kampanii
 */
export interface CampaignBudgetResult {
  campaign_budget: CampaignBudget;
  [key: string]: any;
}

/**
 * Dane do tworzenia budżetu kampanii
 */
export interface CampaignBudgetData {
  name: string;
  amountMicros?: number;
  amount?: number; // Dodane pole do przyjmowania wartości w "normalnych" jednostkach
  deliveryMethod: 'STANDARD' | 'ACCELERATED';
  explicitlyShared?: boolean;
}

/**
 * Własny interfejs dla tworzenia budżetu kampanii (używany wewnętrznie w serwisie)
 */
export interface CampaignBudgetInput {
  name: string;
  amount_micros: number;
  delivery_method: string;
  explicitly_shared: boolean;
}

/**
 * Interface dla elementu results w odpowiedzi z Google Ads API
 */
export interface IMutateCampaignBudgetResult {
  resource_name?: string | null;
  [key: string]: any;
}

/**
 * Interfejs dla Status z Google Ads API
 */
export interface IStatus {
  code?: number | null;
  message?: string | null;
  details?: any[] | null;
  [key: string]: any;
}

/**
 * Interfejs oryginalnej odpowiedzi z API Google Ads
 */
export interface MutateCampaignBudgetsResponse {
  partial_failure_error?: IStatus | null;
  results: IMutateCampaignBudgetResult[];
}

/**
 * Rozszerzony interfejs odpowiedzi po utworzeniu budżetu kampanii,
 * zawierający dodatkowe pole id, które wyciągamy z resource_name
 */
export interface CampaignBudgetCreateResponse extends MutateCampaignBudgetsResponse {
  id?: string; // Dodane pole z ID wyciągniętym z resource_name
}