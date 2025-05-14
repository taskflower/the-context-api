// src/services/googleads/bidding-strategy.service.ts
import { CustomerService } from "./customer.service";
import {
  BiddingStrategyResult,
  CreateBiddingStrategyData,
  BiddingStrategyInput,
} from "./bidding-strategy.types";
import { CommonOptions as CustomerCommonOptions } from "./customer.types";

export class BiddingStrategyService {
  constructor(private customerService: CustomerService) {}

  async getBiddingStrategies(options: CustomerCommonOptions) {
    try {
      const customer = this.customerService.getCustomer(options);

      const biddingStrategies = (await customer.query(`
        SELECT 
          bidding_strategy.id,
          bidding_strategy.name,
          bidding_strategy.type,
          bidding_strategy.effective_currency_code,
          bidding_strategy.campaign_count,
          bidding_strategy.non_removed_campaign_count,
          bidding_strategy.target_cpa.target_cpa_micros,
          bidding_strategy.target_roas.target_roas,
          bidding_strategy.maximize_conversion_value.target_roas
        FROM bidding_strategy
        ORDER BY bidding_strategy.name
      `)) as BiddingStrategyResult[];

      // Konwersja z mikro-jednostek na normalne wartości
      return biddingStrategies.map((strategy) => {
        if (!strategy.bidding_strategy) return strategy;

        const result = { ...strategy };
        const bs = strategy.bidding_strategy;

        if (bs.target_cpa) {
          result.bidding_strategy = {
            ...bs,
            target_cpa: {
              ...bs.target_cpa,
              target_cpa: (bs.target_cpa.target_cpa_micros || 0) / 1_000_000,
            },
          };
        }

        return result;
      });
    } catch (error) {
      console.error("Błąd podczas pobierania strategii licytacji:", error);
      throw error;
    }
  }

  async getBiddingStrategyById(
    options: CustomerCommonOptions,
    biddingStrategyId: string
  ) {
    try {
      const customer = this.customerService.getCustomer(options);

      const results = (await customer.query(`
        SELECT 
          bidding_strategy.id,
          bidding_strategy.name,
          bidding_strategy.type,
          bidding_strategy.effective_currency_code,
          bidding_strategy.campaign_count,
          bidding_strategy.non_removed_campaign_count,
          bidding_strategy.target_cpa.target_cpa_micros,
          bidding_strategy.target_roas.target_roas,
          bidding_strategy.maximize_conversion_value.target_roas
        FROM bidding_strategy
        WHERE bidding_strategy.id = ${biddingStrategyId}
      `)) as BiddingStrategyResult[];

      if (!results.length) {
        throw new Error(
          `Strategia licytacji o ID ${biddingStrategyId} nie została znaleziona`
        );
      }

      const strategy = results[0];
      if (!strategy.bidding_strategy) return strategy;

      const result = { ...strategy };
      const bs = strategy.bidding_strategy;

      if (bs.target_cpa) {
        result.bidding_strategy = {
          ...bs,
          target_cpa: {
            ...bs.target_cpa,
            target_cpa: (bs.target_cpa.target_cpa_micros || 0) / 1_000_000,
          },
        };
      }

      return result;
    } catch (error) {
      console.error(
        `Błąd podczas pobierania strategii licytacji o ID ${biddingStrategyId}:`,
        error
      );
      throw error;
    }
  }

  async createBiddingStrategy(
    options: CustomerCommonOptions,
    strategyData: CreateBiddingStrategyData
  ) {
    try {
      const customer = this.customerService.getCustomer(options);

      // Budujemy obiekt do wysłania
      const biddingStrategy: BiddingStrategyInput = {
        name: strategyData.name,
        type: strategyData.type,
      };

      if (strategyData.type === "TARGET_CPA" && strategyData.targetCpaMicros) {
        biddingStrategy.target_cpa = {
          target_cpa_micros: strategyData.targetCpaMicros,
        };
      } else if (
        strategyData.type === "TARGET_ROAS" &&
        strategyData.targetRoas
      ) {
        biddingStrategy.target_roas = {
          target_roas: strategyData.targetRoas,
        };
      }

      // TS wymaga typu IBiddingStrategy|BiddingStrategy, więc rzutujemy nasz DTO na any
      const payload = [biddingStrategy] as any[];
      const response = await customer.biddingStrategies.create(payload);
      return response;
    } catch (error) {
      console.error("Błąd podczas tworzenia strategii licytacji:", error);
      throw error;
    }
  }
}
