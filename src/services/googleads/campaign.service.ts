// src/services/googleads/campaign.service.ts

import { CommonOptions }     from './customer.types';
import { CustomerService }   from './customer.service';
import { CampaignData }      from './campaign.types';
import { resources }         from 'google-ads-api';

export class CampaignService {
  constructor(private customerService: CustomerService) {}

  async getCampaigns(options: CommonOptions) {
    try {
      const customer = this.customerService.getCustomer(options);

      const campaigns = await customer.query(`
        SELECT 
          campaign.id, 
          campaign.name, 
          campaign.status, 
          campaign.start_date, 
          campaign.end_date, 
          campaign.advertising_channel_type, 
          campaign_budget.amount_micros,
          metrics.impressions, 
          metrics.clicks, 
          metrics.cost_micros, 
          metrics.conversions,
          metrics.conversions_value,
          metrics.ctr, 
          metrics.average_cpc
        FROM campaign
        ORDER BY campaign.name
      `);

      return campaigns.map(item => ({
        ...item,
        campaign_budget: item.campaign_budget
          ? {
              ...item.campaign_budget,
              amount: (item.campaign_budget.amount_micros || 0) / 1_000_000
            }
          : null,
        metrics: item.metrics
          ? {
              ...item.metrics,
              cost: (item.metrics.cost_micros || 0) / 1_000_000,
              average_cpc: (item.metrics.average_cpc || 0) / 1_000_000
            }
          : null
      }));
    } catch (error) {
      console.error('Błąd podczas pobierania kampanii:', error);
      throw error;
    }
  }

  async createCampaign(options: CommonOptions, campaignData: CampaignData) {
    try {
      const customer = this.customerService.getCustomer(options);

      // Tworzymy obiekt Campaign przy użyciu resources.Campaign
      const campaign = new resources.Campaign({
        // resource_name zostanie wygenerowany przez API po stronie serwera
        name: campaignData.name,
        status: campaignData.status,
        advertising_channel_type: campaignData.advertisingChannelType,
        campaign_budget: `customers/${options.customerId}/campaignBudgets/${campaignData.campaignBudgetId}`,
        // Opcjonalne pola
        ...(campaignData.startDate && { start_date: campaignData.startDate }),
        ...(campaignData.endDate   && { end_date: campaignData.endDate })
      });

      // Dodaj parametry strategii licytacji
      if (campaignData.biddingStrategyId) {
        campaign.bidding_strategy = 
          `customers/${options.customerId}/biddingStrategies/${campaignData.biddingStrategyId}`;
      } else if (campaignData.biddingStrategyType) {
        campaign.bidding_strategy_type = campaignData.biddingStrategyType;
        if (campaignData.biddingStrategyType === 'TARGET_CPA' && campaignData.targetCpaMicros) {
          campaign.target_cpa = { target_cpa_micros: campaignData.targetCpaMicros };
        }
        if (campaignData.biddingStrategyType === 'TARGET_ROAS' && campaignData.targetRoas) {
          campaign.target_roas = { target_roas: campaignData.targetRoas };
        }
      }

      // Przekazujemy tablicę obiektów Campaign
      const response = await customer.campaigns.create([campaign]);
      return response;
    } catch (error) {
      console.error('Błąd podczas tworzenia kampanii:', error);
      throw error;
    }
  }
}
