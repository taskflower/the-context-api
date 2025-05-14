// src/services/googleads/types/bidding-strategy.types.ts
import { CommonOptions } from './customer.types';

/**
 * Interfejs dla strategii licytacji - Target CPA
 */
export interface BiddingStrategyTargetCpa {
  target_cpa_micros: number;
  target_cpa?: number; // Wartość po konwersji z mikro-jednostek
}

/**
 * Interfejs dla strategii licytacji - Target ROAS
 */
export interface BiddingStrategyTargetRoas {
  target_roas: number;
}

/**
 * Interfejs dla strategii licytacji - Maximize Conversion Value
 */
export interface BiddingStrategyMaximizeConversionValue {
  target_roas?: number;
}

/**
 * Główny interfejs dla strategii licytacji
 */
export interface BiddingStrategy {
  id: string;
  name: string;
  type: string;
  effective_currency_code?: string;
  campaign_count?: number;
  non_removed_campaign_count?: number;
  target_cpa?: BiddingStrategyTargetCpa;
  target_roas?: BiddingStrategyTargetRoas;
  maximize_conversion_value?: BiddingStrategyMaximizeConversionValue;
}

/**
 * Wynik zapytania dla strategii licytacji
 */
export interface BiddingStrategyResult {
  bidding_strategy: BiddingStrategy;
  [key: string]: any;
}

/**
 * Dane do tworzenia strategii licytacji
 */
export interface CreateBiddingStrategyData {
  name: string;
  type: 'TARGET_CPA' | 'TARGET_ROAS' | 'MAXIMIZE_CONVERSIONS' | 'MAXIMIZE_CONVERSION_VALUE';
  targetCpaMicros?: number;
  targetRoas?: number;
}

/**
 * Własny interfejs dla tworzenia strategii licytacji (używany wewnętrznie w serwisie)
 */
export interface BiddingStrategyInput {
  name: string;
  type: string;
  target_cpa?: {
    target_cpa_micros: number;
  };
  target_roas?: {
    target_roas: number;
  };
}