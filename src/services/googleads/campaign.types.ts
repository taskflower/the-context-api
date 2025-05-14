// src/services/googleads/types/campaign.types.ts
import { CommonOptions } from './customer.types';

/**
 * Interfejs dla metryk kampanii
 */
export interface CampaignMetrics {
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
 * Interfejs kampanii
 */
export interface Campaign {
  id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  advertising_channel_type: string;
  campaign_budget?: any;
  metrics?: CampaignMetrics;
}

/**
 * Dane do tworzenia kampanii
 */
export interface CampaignData {
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  advertisingChannelType: 'SEARCH' | 'DISPLAY' | 'VIDEO' | 'SHOPPING' | 'HOTEL' | 'MULTI_CHANNEL';
  biddingStrategyId?: string;
  biddingStrategyType?: 'TARGET_CPA' | 'TARGET_ROAS' | 'MAXIMIZE_CONVERSIONS' | 'MAXIMIZE_CONVERSION_VALUE';
  targetCpaMicros?: number;
  targetRoas?: number;
  campaignBudgetId: string;
  startDate?: string; // format: YYYYMMDD
  endDate?: string;   // format: YYYYMMDD
}

/**
 * Własny interfejs dla tworzenia kampanii (używany wewnętrznie w serwisie)
 */
export interface CampaignInput {
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  advertising_channel_type: string;
  campaign_budget: string;
  start_date?: string;
  end_date?: string;
  bidding_strategy?: string;
  bidding_strategy_type?: string;
  target_cpa?: {
    target_cpa_micros: number;
  };
  target_roas?: {
    target_roas: number;
  };
}