// src/services/googleads/types/ad-group.types.ts
import { CommonOptions } from './customer.types';

/**
 * Interfejs dla metryk grupy reklam
 */
export interface AdGroupMetrics {
  impressions?: number;
  clicks?: number;
  cost_micros?: number;
  cost?: number; // Wartość po konwersji z mikro-jednostek
  conversions?: number;
  conversions_value?: number;
  ctr?: number;
  average_cpc?: number;
}

/**
 * Interfejs grupy reklam
 */
export interface AdGroup {
  id: string;
  name: string;
  status: string;
  campaign_id?: string;
  campaign_name?: string;
  type?: string;
  metrics?: AdGroupMetrics;
}

/**
 * Dane do tworzenia grupy reklam
 */
export interface AdGroupData {
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  campaignId: string;
  type?: string;
  cpcBidMicros?: number;
}

/**
 * Własny interfejs dla tworzenia grupy reklam (używany wewnętrznie w serwisie)
 */
export interface AdGroupInput {
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  campaign: string;
  type?: string;
  cpc_bid_micros?: number;
}