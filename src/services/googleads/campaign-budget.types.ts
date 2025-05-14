// src/services/googleads/campaign-budget.types.ts
import { CommonOptions } from './customer.types';

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