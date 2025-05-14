// src/services/googleads/googleads.routes.ts
import { Router, Response, Request } from 'express';
import { verifyToken } from "../../middleware/auth.middleware";
import { permanentTokenConsumption } from "../../middleware/token-usage.middleware";
import { googleAdsService } from './googleads.service';
import { CreateBiddingStrategyData } from './bidding-strategy.types';
import { CampaignBudgetData } from './campaign-budget.types';
import { CampaignData } from './campaign.types';
import { AdGroupData } from './ad-group.types';
import { ApiError, ErrorCodes } from "../../errors/errors.utilsts";
import { campaignBudgetErrorHandler } from './campaign-budget.errors';

const router = Router();

// Helper function to handle async routes
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => 
  (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch(err => {
      console.error('Nieobsłużony błąd:', err);
      res.status(500).json({ 
        success: false, 
        message: `Błąd Google Ads API: ${err.message || 'Nieznany błąd'}`,
        error: {
          message: err.message,
          stack: err.stack,
          details: err.details || 'brak szczegółów'
        }
      });
    });
  };

// Funkcja pomocnicza do pobierania parametrów autoryzacyjnych
const getAuthParams = (req: Request) => {
  const refreshToken = req.query.refreshToken as string || process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
  const customerId = req.query.customerId as string || process.env.GOOGLE_ADS_CUSTOMER_ID || '';
  const loginCustomerId = req.query.loginCustomerId as string || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  
  return { refreshToken, customerId, loginCustomerId };
};

// Dodajemy middleware uwierzytelniania i śledzenia tokenów dla wszystkich endpointów
router.use(verifyToken);
router.use(permanentTokenConsumption(0)); // Koszt 0 tokenów dla wszystkich endpointów Google Ads

// Test bezpośredniego dostępu do Google Ads API
router.get('/direct-test', asyncHandler(async (req: Request, res: Response) => {
  console.log('Rozpoczynam test bezpośredniego dostępu do Google Ads API');
  
  const { hasMissing, missingVars } = googleAdsService.validateEnvVars();
  
  if (hasMissing) {
    console.error('Brakujące zmienne środowiskowe!');
    return res.status(500).json({
      success: false,
      message: 'Brakujące zmienne środowiskowe Google Ads',
      missingVars
    });
  }
  
  const { refreshToken } = getAuthParams(req);
  
  const accessibleCustomers = await googleAdsService.checkAccess(refreshToken);
  
  return res.status(200).json({
    success: true,
    message: 'Autoryzacja Google Ads API działa poprawnie',
    data: { accessibleCustomers }
  });
}));

// BIDDING STRATEGIES ENDPOINTS
// ===========================

// Get all bidding strategies
router.get('/bidding-strategies', asyncHandler(async (req: Request, res: Response) => {
  console.log('Pobieranie strategii licytacji Google Ads');
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  if (!refreshToken || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'Brakuje tokenu odświeżania lub ID klienta',
      details: {
        hasRefreshToken: !!refreshToken,
        hasCustomerId: !!customerId
      }
    });
  }
  
  const biddingStrategies = await googleAdsService.getBiddingStrategies(
    refreshToken,
    customerId,
    loginCustomerId
  );
  
  return res.status(200).json({
    success: true,
    message: 'Strategie licytacji pobrane pomyślnie',
    data: { biddingStrategies }
  });
}));

// Get bidding strategy by ID
router.get('/bidding-strategies/:id', asyncHandler(async (req: Request, res: Response) => {
  const biddingStrategyId = req.params.id;
  console.log(`Pobieranie strategii licytacji o ID ${biddingStrategyId}`);
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  if (!refreshToken || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'Brakuje tokenu odświeżania lub ID klienta',
      details: {
        hasRefreshToken: !!refreshToken,
        hasCustomerId: !!customerId
      }
    });
  }
  
  const biddingStrategy = await googleAdsService.getBiddingStrategyById(
    refreshToken,
    customerId,
    biddingStrategyId,
    loginCustomerId
  );
  
  return res.status(200).json({
    success: true,
    message: 'Strategia licytacji pobrana pomyślnie',
    data: { biddingStrategy }
  });
}));

// Create new bidding strategy
router.post('/bidding-strategies', asyncHandler(async (req: Request, res: Response) => {
  console.log('Tworzenie nowej strategii licytacji');
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  if (!refreshToken || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'Brakuje tokenu odświeżania lub ID klienta',
      details: {
        hasRefreshToken: !!refreshToken,
        hasCustomerId: !!customerId
      }
    });
  }
  
  const strategyData: CreateBiddingStrategyData = req.body;
  
  const response = await googleAdsService.createBiddingStrategy(
    refreshToken,
    customerId,
    strategyData,
    loginCustomerId
  );
  
  return res.status(201).json({
    success: true,
    message: 'Strategia licytacji utworzona pomyślnie',
    data: { response }
  });
}));

// CAMPAIGN BUDGETS ENDPOINTS
// =========================

// Get all campaign budgets
router.get('/campaign-budgets', campaignBudgetErrorHandler(async (req: Request, res: Response) => {
  console.log('Pobieranie budżetów kampanii Google Ads');
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  if (!refreshToken || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'Brakuje tokenu odświeżania lub ID klienta',
      details: {
        hasRefreshToken: !!refreshToken,
        hasCustomerId: !!customerId
      }
    });
  }
  
  const campaignBudgets = await googleAdsService.getCampaignBudgets(
    refreshToken,
    customerId,
    loginCustomerId
  );
  
  return res.status(200).json({
    success: true,
    message: 'Budżety kampanii pobrane pomyślnie',
    data: { campaignBudgets }
  });
}));

// Create new campaign budget
router.post('/campaign-budgets', campaignBudgetErrorHandler(async (req: Request, res: Response) => {
  console.log('Tworzenie nowego budżetu kampanii');
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  if (!refreshToken || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'Brakuje tokenu odświeżania lub ID klienta',
      details: {
        hasRefreshToken: !!refreshToken,
        hasCustomerId: !!customerId
      }
    });
  }
  
  const budgetData: CampaignBudgetData = req.body;
  
  const response = await googleAdsService.createCampaignBudget(
    refreshToken,
    customerId,
    budgetData,
    loginCustomerId
  );
  
  return res.status(201).json({
    success: true,
    message: 'Budżet kampanii utworzony pomyślnie',
    data: { response }
  });
}));

// CAMPAIGNS ENDPOINTS
// =================

// Get all campaigns
router.get('/campaigns', asyncHandler(async (req: Request, res: Response) => {
  console.log('Pobieranie kampanii Google Ads');
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  if (!refreshToken || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'Brakuje tokenu odświeżania lub ID klienta',
      details: {
        hasRefreshToken: !!refreshToken,
        hasCustomerId: !!customerId
      }
    });
  }
  
  const campaigns = await googleAdsService.getCampaigns(
    refreshToken,
    customerId,
    loginCustomerId
  );
  
  return res.status(200).json({
    success: true,
    message: 'Kampanie pobrane pomyślnie',
    data: { campaigns }
  });
}));

// Create new campaign
router.post('/campaigns', asyncHandler(async (req: Request, res: Response) => {
  console.log('Tworzenie nowej kampanii');
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  if (!refreshToken || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'Brakuje tokenu odświeżania lub ID klienta',
      details: {
        hasRefreshToken: !!refreshToken,
        hasCustomerId: !!customerId
      }
    });
  }
  
  const campaignData: CampaignData = req.body;
  
  const response = await googleAdsService.createCampaign(
    refreshToken,
    customerId,
    campaignData,
    loginCustomerId
  );
  
  return res.status(201).json({
    success: true,
    message: 'Kampania utworzona pomyślnie',
    data: { response }
  });
}));

// AD GROUPS ENDPOINTS
// =================

// Get all ad groups (optionally filtered by campaign)
router.get('/ad-groups', asyncHandler(async (req: Request, res: Response) => {
  console.log('Pobieranie grup reklam Google Ads');
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  const campaignId = req.query.campaignId as string;
  
  if (!refreshToken || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'Brakuje tokenu odświeżania lub ID klienta',
      details: {
        hasRefreshToken: !!refreshToken,
        hasCustomerId: !!customerId
      }
    });
  }
  
  const adGroups = await googleAdsService.getAdGroups(
    refreshToken,
    customerId,
    campaignId,
    loginCustomerId
  );
  
  return res.status(200).json({
    success: true,
    message: 'Grupy reklam pobrane pomyślnie',
    data: { adGroups }
  });
}));

// Create new ad group
router.post('/ad-groups', asyncHandler(async (req: Request, res: Response) => {
  console.log('Tworzenie nowej grupy reklam');
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  if (!refreshToken || !customerId) {
    return res.status(400).json({
      success: false,
      message: 'Brakuje tokenu odświeżania lub ID klienta',
      details: {
        hasRefreshToken: !!refreshToken,
        hasCustomerId: !!customerId
      }
    });
  }
  
  const adGroupData: AdGroupData = req.body;
  
  const response = await googleAdsService.createAdGroup(
    refreshToken,
    customerId,
    adGroupData,
    loginCustomerId
  );
  
  return res.status(201).json({
    success: true,
    message: 'Grupa reklam utworzona pomyślnie',
    data: { response }
  });
}));

export default router;