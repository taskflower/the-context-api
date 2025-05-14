// src/services/googleads/campaign-budget.service.ts

import { CommonOptions } from './customer.types';
import { CustomerService }   from './customer.service';
import { CampaignBudgetData } from './campaign-budget.types';
import { resources }          from 'google-ads-api';

export class CampaignBudgetService {
  constructor(private customerService: CustomerService) {}

  async getCampaignBudgets(options: CommonOptions) {
    try {
      const customer = this.customerService.getCustomer(options);

      const budgets = await customer.query(`
        SELECT 
          campaign_budget.id,
          campaign_budget.name,
          campaign_budget.amount_micros,
          campaign_budget.status,
          campaign_budget.delivery_method,
          campaign_budget.type
        FROM campaign_budget
        ORDER BY campaign_budget.name
      `);

      return budgets.map(row => {
        if (!row.campaign_budget) return row;
        return {
          ...row,
          campaign_budget: {
            ...row.campaign_budget,
            amount: (row.campaign_budget.amount_micros ?? 0) / 1_000_000
          }
        };
      });
    } catch (error) {
      console.error('Błąd podczas pobierania budżetów kampanii:', error);
      throw error;
    }
  }

  async createCampaignBudget(
    options: CommonOptions,
    budgetData: CampaignBudgetData
  ) {
    try {
      const customer = this.customerService.getCustomer(options);

      // Używamy klasy resources.CampaignBudget z biblioteki google-ads-api,
      // aby uzyskać poprawny typ zgodny z ICampaignBudget
      const campaignBudget = new resources.CampaignBudget({
        name: budgetData.name,
        amount_micros: budgetData.amountMicros,
        delivery_method: budgetData.deliveryMethod,
        explicitly_shared: budgetData.explicitlyShared ?? false
      });

      const response = await customer.campaignBudgets.create([campaignBudget]);
      return response;
    } catch (error) {
      console.error('Błąd podczas tworzenia budżetu kampanii:', error);
      throw error;
    }
  }
}
