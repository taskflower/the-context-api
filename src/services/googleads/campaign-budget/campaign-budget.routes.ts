// src/services/googleads/campaign-budget/campaign-budget.routes.ts

import { Router, Response, Request } from 'express';
import { CustomerService } from '../customer.service';
import { CampaignBudgetService } from './campaign-budget.service';
import { CampaignBudgetData } from './campaign-budget.types';
import { campaignBudgetErrorHandler } from './campaign-budget.errors';
import { ErrorCodes } from '../errors'; // Updated import path

// Inicjalizujemy serwisy
const customerService = new CustomerService(
  process.env.GOOGLE_ADS_CLIENT_ID || '',
  process.env.GOOGLE_ADS_CLIENT_SECRET || '',
  process.env.GOOGLE_ADS_DEVELOPER_TOKEN || ''
);
const campaignBudgetService = new CampaignBudgetService(customerService);

// Tworzymy router dla budżetów kampanii
const campaignBudgetRouter = Router();

// Funkcja pomocnicza do pobierania parametrów autoryzacyjnych
const getAuthParams = (req: Request) => {
  const refreshToken = req.query.refreshToken as string || process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
  const customerId = req.query.customerId as string || process.env.GOOGLE_ADS_CUSTOMER_ID || '';
  const loginCustomerId = req.query.loginCustomerId as string || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  
  return { refreshToken, customerId, loginCustomerId };
};

// Funkcja pomocnicza do sprawdzania wymaganych parametrów
const checkRequiredParams = (refreshToken: string, customerId: string) => {
  if (!refreshToken || !customerId) {
    return {
      isValid: false,
      errorResponse: {
        success: false,
        error: {
          code: ErrorCodes.INVALID_INPUT,
          message: 'Brakuje tokenu odświeżania lub ID klienta',
          details: {
            hasRefreshToken: !!refreshToken,
            hasCustomerId: !!customerId
          }
        }
      }
    };
  }
  return { isValid: true };
}

// Get all campaign budgets
campaignBudgetRouter.get('/', campaignBudgetErrorHandler(async (req: Request, res: Response) => {
  console.log('Pobieranie budżetów kampanii Google Ads');
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  const paramsCheck = checkRequiredParams(refreshToken, customerId);
  if (!paramsCheck.isValid) {
    return res.status(400).json(paramsCheck.errorResponse);
  }
  
  const campaignBudgets = await campaignBudgetService.getCampaignBudgets({
    refreshToken,
    customerId,
    loginCustomerId
  });
  
  return res.status(200).json({
    success: true,
    message: 'Budżety kampanii pobrane pomyślnie',
    data: { campaignBudgets }
  });
}));

// Get campaign budget by ID
campaignBudgetRouter.get('/:id', campaignBudgetErrorHandler(async (req: Request, res: Response) => {
  const budgetId = req.params.id;
  console.log(`Pobieranie budżetu kampanii o ID ${budgetId}`);
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  const paramsCheck = checkRequiredParams(refreshToken, customerId);
  if (!paramsCheck.isValid) {
    return res.status(400).json(paramsCheck.errorResponse);
  }
  
  const campaignBudget = await campaignBudgetService.getCampaignBudgetById(
    {
      refreshToken,
      customerId,
      loginCustomerId
    }, 
    budgetId
  );
  
  return res.status(200).json({
    success: true,
    message: 'Budżet kampanii pobrany pomyślnie',
    data: { campaignBudget }
  });
}));

// Create new campaign budget
campaignBudgetRouter.post('/', campaignBudgetErrorHandler(async (req: Request, res: Response) => {
  console.log('Tworzenie nowego budżetu kampanii');
  
  const { refreshToken, customerId, loginCustomerId } = getAuthParams(req);
  
  const paramsCheck = checkRequiredParams(refreshToken, customerId);
  if (!paramsCheck.isValid) {
    return res.status(400).json(paramsCheck.errorResponse);
  }
  
  const budgetData: CampaignBudgetData = req.body;
  
  // Dodatkowa walidacja danych wejściowych
  if (!budgetData.name || budgetData.name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BUDGET_NAME_REQUIRED',
        message: 'Nazwa budżetu jest wymagana',
        details: {}
      }
    });
  }
  
  if (
    (!budgetData.amountMicros && !budgetData.amount) || 
    (budgetData.amountMicros && isNaN(Number(budgetData.amountMicros))) ||
    (budgetData.amount && isNaN(Number(budgetData.amount)))
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_BUDGET_AMOUNT',
        message: 'Nieprawidłowa wartość budżetu. Wymagana jest liczba większa od zera.',
        details: {}
      }
    });
  }
  
  const response = await campaignBudgetService.createCampaignBudget(
    {
      refreshToken,
      customerId,
      loginCustomerId
    },
    budgetData
  );
  
  return res.status(201).json({
    success: true,
    message: 'Budżet kampanii utworzony pomyślnie',
    data: { 
      response,
      id: response.id || undefined
    }
  });
}));

export default campaignBudgetRouter;