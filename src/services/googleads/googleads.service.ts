// src/services/googleads/googleads.service.ts
import { CustomerService } from './customer.service';
import { BiddingStrategyService } from './bidding-strategy.service';
import { CampaignBudgetService } from './campaign-budget/campaign-budget.service';
import { CampaignService } from './campaign.service';
import { AdGroupService } from './ad-group.service';
import { CommonOptions } from './customer.types';
import { CreateBiddingStrategyData } from './bidding-strategy.types';
import { CampaignBudgetData } from './campaign-budget/campaign-budget.types';
import { CampaignData } from './campaign.types';
import { AdGroupData } from './ad-group.types';


export class GoogleAdsService {
  private customerService: CustomerService;
  private biddingStrategyService: BiddingStrategyService;
  private campaignBudgetService: CampaignBudgetService;
  private campaignService: CampaignService;
  private adGroupService: AdGroupService;
  
  constructor() {
    this.customerService = new CustomerService(
      process.env.GOOGLE_ADS_CLIENT_ID || '',
      process.env.GOOGLE_ADS_CLIENT_SECRET || '',
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN || ''
    );
    
    this.biddingStrategyService = new BiddingStrategyService(this.customerService);
    this.campaignBudgetService = new CampaignBudgetService(this.customerService);
    this.campaignService = new CampaignService(this.customerService);
    this.adGroupService = new AdGroupService(this.customerService);
  }

  // Funkcje pomocnicze
  async checkAccess(refreshToken: string) {
    return this.customerService.checkAccess(refreshToken);
  }

  validateEnvVars() {
    const missingVars = {
      ...this.customerService.validateEnvVars().missingVars,
      refreshToken: !process.env.GOOGLE_ADS_REFRESH_TOKEN,
      customerId: !process.env.GOOGLE_ADS_CUSTOMER_ID
    };
    
    const hasMissing = Object.values(missingVars).some(missing => missing);
    return { hasMissing, missingVars };
  }

  // Funkcje dla strategii licytacji
  async getBiddingStrategies(refreshToken: string, customerId: string, loginCustomerId?: string) {
    const options: CommonOptions = { refreshToken, customerId, loginCustomerId };
    return this.biddingStrategyService.getBiddingStrategies(options);
  }

  async getBiddingStrategyById(refreshToken: string, customerId: string, biddingStrategyId: string, loginCustomerId?: string) {
    const options: CommonOptions = { refreshToken, customerId, loginCustomerId };
    return this.biddingStrategyService.getBiddingStrategyById(options, biddingStrategyId);
  }

  async createBiddingStrategy(refreshToken: string, customerId: string, strategyData: CreateBiddingStrategyData, loginCustomerId?: string) {
    const options: CommonOptions = { refreshToken, customerId, loginCustomerId };
    return this.biddingStrategyService.createBiddingStrategy(options, strategyData);
  }

  // Funkcje dla budżetów kampanii
  async getCampaignBudgets(refreshToken: string, customerId: string, loginCustomerId?: string) {
    const options: CommonOptions = { refreshToken, customerId, loginCustomerId };
    return this.campaignBudgetService.getCampaignBudgets(options);
  }

  async getCampaignBudgetById(refreshToken: string, customerId: string, budgetId: string, loginCustomerId?: string) {
    const options: CommonOptions = { refreshToken, customerId, loginCustomerId };
    return this.campaignBudgetService.getCampaignBudgetById(options, budgetId);
  }

  async createCampaignBudget(refreshToken: string, customerId: string, budgetData: CampaignBudgetData, loginCustomerId?: string) {
    const options: CommonOptions = { refreshToken, customerId, loginCustomerId };
    return this.campaignBudgetService.createCampaignBudget(options, budgetData);
  }

  // Funkcje dla kampanii
  async getCampaigns(refreshToken: string, customerId: string, loginCustomerId?: string) {
    const options: CommonOptions = { refreshToken, customerId, loginCustomerId };
    return this.campaignService.getCampaigns(options);
  }

  async createCampaign(refreshToken: string, customerId: string, campaignData: CampaignData, loginCustomerId?: string) {
    const options: CommonOptions = { refreshToken, customerId, loginCustomerId };
    return this.campaignService.createCampaign(options, campaignData);
  }

  // Funkcje dla grup reklam
  async getAdGroups(refreshToken: string, customerId: string, campaignId?: string, loginCustomerId?: string) {
    const options: CommonOptions = { refreshToken, customerId, loginCustomerId };
    return this.adGroupService.getAdGroups(options, campaignId);
  }

  async createAdGroup(refreshToken: string, customerId: string, adGroupData: AdGroupData, loginCustomerId?: string) {
    const options: CommonOptions = { refreshToken, customerId, loginCustomerId };
    return this.adGroupService.createAdGroup(options, adGroupData);
  }
}

export const googleAdsService = new GoogleAdsService();