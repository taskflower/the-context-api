// src/services/googleads/ad-group.service.ts
import { CustomerService } from './customer.service';
import { CommonOptions } from './customer.types';
import {
  AdGroup,
  AdGroupData,
  AdGroupInput,
  AdGroupMetrics
} from './ad-group.types';

export class AdGroupService {
  constructor(private customerService: CustomerService) {}

  /**
   * Pobiera listę grup reklam dla danego klienta (opcjonalnie filtrowanych po kampanii).
   */
  async getAdGroups(
    options: CommonOptions,
    campaignId?: string
  ): Promise<AdGroup[]> {
    const customer = this.customerService.getCustomer(options);

    let query = `
      SELECT 
        ad_group.id, 
        ad_group.name, 
        ad_group.status, 
        campaign.id as campaign_id, 
        campaign.name as campaign_name,
        ad_group.type,
        metrics.impressions, 
        metrics.clicks, 
        metrics.cost_micros, 
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr, 
        metrics.average_cpc
      FROM ad_group
    `;

    if (campaignId) {
      query += ` WHERE campaign.id = ${campaignId}`;
    }

    query += ' ORDER BY ad_group.name';

    const rawResults = await customer.query(query);

    return rawResults.map((row: any): AdGroup => {
      const metrics: AdGroupMetrics | undefined = row.metrics
        ? {
            impressions: row.metrics.impressions,
            clicks: row.metrics.clicks,
            cost_micros: row.metrics.cost_micros,
            cost: (row.metrics.cost_micros || 0) / 1e6,
            conversions: row.metrics.conversions,
            conversions_value: row.metrics.conversions_value,
            ctr: row.metrics.ctr,
            average_cpc: (row.metrics.average_cpc || 0) / 1e6
          }
        : undefined;

      return {
        id: String(row.ad_group.id),
        name: row.ad_group.name,
        status: row.ad_group.status,
        campaign_id: String(row.campaign_id),
        campaign_name: row.campaign_name,
        type: row.ad_group.type,
        metrics
      };
    });
  }

  /**
   * Tworzy nową grupę reklam w zadanej kampanii.
   */
  async createAdGroup(
    options: CommonOptions,
    adGroupData: AdGroupData
  ): Promise<AdGroup> {
    const customer = this.customerService.getCustomer(options);

    const adGroupInput: AdGroupInput = {
      name: adGroupData.name,
      status: adGroupData.status,
      campaign: `customers/${options.customerId}/campaigns/${adGroupData.campaignId}`,
      type: adGroupData.type,
      cpc_bid_micros: adGroupData.cpcBidMicros
    };

    // Omijamy wymagania TS dla IAdGroup
    const response = await customer.adGroups.create([adGroupInput as any]);

    // Wyciągamy wynik z pola results
    const result = response.results[0];

    // Bezpieczna parsowanie resource_name
    const resourceName = result.resource_name;
    if (!resourceName) {
      throw new Error('Brak resource_name w odpowiedzi MutateAdGroupsResponse');
    }
    const segments = resourceName.split('/');
    const id = segments[segments.length - 1];

    // Używamy typu z wejściowych danych, bo result.type nie istnieje
    const type = adGroupInput.type;

    return {
      id,
      name: adGroupData.name,
      status: adGroupData.status,
      campaign_id: adGroupData.campaignId,
      campaign_name: undefined,
      type,
      metrics: undefined
    };
  }
}