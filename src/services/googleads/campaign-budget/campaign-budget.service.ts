// src/services/googleads/campaign-budget/campaign-budget.service.ts

import { CommonOptions } from '../customer.types';
import { CustomerService } from '../customer.service';
import { CampaignBudgetData, CampaignBudgetCreateResponse } from './campaign-budget.types';
import { resources } from 'google-ads-api';

export class CampaignBudgetService {
  constructor(private customerService: CustomerService) {}

  /**
   * Pobiera listę budżetów kampanii dla danego klienta
   * @param options Opcje wspólne (refreshToken, customerId, loginCustomerId)
   * @returns Lista budżetów kampanii
   */
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

      // Konwertujemy wartości z mikro-jednostek na normalne wartości
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
      throw error; // Przekazujemy błąd do handlera błędów
    }
  }

  /**
   * Pobiera pojedynczy budżet kampanii po ID
   * @param options Opcje wspólne
   * @param budgetId ID budżetu kampanii
   * @returns Budżet kampanii
   */
  async getCampaignBudgetById(options: CommonOptions, budgetId: string) {
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
        WHERE campaign_budget.id = ${budgetId}
      `);

      if (!budgets || budgets.length === 0) {
        throw new Error(`Budżet kampanii o ID ${budgetId} nie został znaleziony`);
      }

      const budget = budgets[0];
      
      if (!budget.campaign_budget) return budget;
      
      return {
        ...budget,
        campaign_budget: {
          ...budget.campaign_budget,
          amount: (budget.campaign_budget.amount_micros ?? 0) / 1_000_000
        }
      };
    } catch (error) {
      console.error(`Błąd podczas pobierania budżetu kampanii o ID ${budgetId}:`, error);
      throw error;
    }
  }

  /**
   * Tworzy nowy budżet kampanii
   * @param options Opcje wspólne
   * @param budgetData Dane budżetu kampanii
   * @returns Odpowiedź z API Google Ads
   */
  async createCampaignBudget(
    options: CommonOptions,
    budgetData: CampaignBudgetData
  ): Promise<CampaignBudgetCreateResponse> {
    try {
      // Walidacja danych wejściowych
      if (!budgetData.name || budgetData.name.trim() === '') {
        throw new Error('Nazwa budżetu jest wymagana');
      }

      const customer = this.customerService.getCustomer(options);

      // Obsługa przypadku, gdy podano amount zamiast amountMicros
      if (!budgetData.amountMicros && budgetData.amount) {
        budgetData.amountMicros = Math.round(budgetData.amount * 1_000_000);
      }

      // Sprawdzenie, czy amountMicros jest poprawną liczbą
      if (!budgetData.amountMicros || isNaN(Number(budgetData.amountMicros)) || Number(budgetData.amountMicros) <= 0) {
        throw new Error('Nieprawidłowa wartość budżetu. Wymagana jest liczba większa od zera.');
      }

      // Konwersja na liczbę
      budgetData.amountMicros = Number(budgetData.amountMicros);

      // Sprawdzenie metody dostarczania
      if (!budgetData.deliveryMethod || !['STANDARD', 'ACCELERATED'].includes(budgetData.deliveryMethod)) {
        throw new Error('Nieprawidłowa metoda dostarczania budżetu. Dozwolone wartości: STANDARD, ACCELERATED');
      }

      // Używamy klasy resources.CampaignBudget z biblioteki google-ads-api,
      // aby uzyskać poprawny typ zgodny z ICampaignBudget
      const campaignBudget = new resources.CampaignBudget({
        name: budgetData.name,
        amount_micros: budgetData.amountMicros,
        delivery_method: budgetData.deliveryMethod,
        explicitly_shared: budgetData.explicitlyShared ?? false
      });

      const response = await customer.campaignBudgets.create([campaignBudget]);
      
      // Ekstrahujemy ID z resource_name
      let id: string | undefined;
      if (response && response.results && response.results.length > 0) {
        const result = response.results[0];
        const resourceName = result.resource_name || '';
        id = resourceName.split('/').pop() || undefined;
      }
      
      // Zwracamy z naszym rozszerzonym typem, który zawiera pole 'id'
      return {
        ...response,
        id
      };
    } catch (error) {
      console.error('Błąd podczas tworzenia budżetu kampanii:', error);
      throw error; // Przekazujemy błąd do handlera błędów
    }
  }
}