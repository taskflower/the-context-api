// src/services/googleads/campaign-budget/campaign-budget.errors.ts

import { ApiError } from '../../../errors/errors.utilsts';
import { handleGoogleAdsError, GoogleAdsErrorCodes } from '../errors';

// Rozszerzamy kody błędów specyficzne dla budżetów kampanii
export enum CampaignBudgetErrorCodes {
  BUDGET_ALREADY_EXISTS = 'BUDGET_ALREADY_EXISTS',
  INVALID_BUDGET_AMOUNT = 'INVALID_BUDGET_AMOUNT',
  DELIVERY_METHOD_INVALID = 'DELIVERY_METHOD_INVALID',
  BUDGET_NAME_REQUIRED = 'BUDGET_NAME_REQUIRED',
  BUDGET_NOT_FOUND = 'BUDGET_NOT_FOUND'
}

/**
 * Obsługuje błędy specyficzne dla budżetów kampanii
 * @param error Oryginalny błąd z Google Ads API
 * @returns Sformatowany obiekt ApiError
 */
export function handleCampaignBudgetError(error: any): ApiError {
  // Najpierw przetwarzamy ogólne błędy Google Ads
  const baseError = handleGoogleAdsError(error);
  
  // Teraz sprawdzamy, czy nie jest to błąd specyficzny dla budżetów kampanii
  // i nadpisujemy odpowiednie pola jeśli to konieczne
  
  const errorMessage = error.message || '';
  const errorDetails = error.details || '';
  
  // Sprawdzanie specyficznych błędów budżetów
  if (errorMessage.includes('already exists') || errorDetails.includes('already exists')) {
    return new ApiError(
      409, // Conflict
      'Budżet kampanii o tej nazwie już istnieje',
      CampaignBudgetErrorCodes.BUDGET_ALREADY_EXISTS,
      baseError.details
    );
  } 
  else if (
    errorMessage.includes('amount') || 
    errorDetails.includes('amount') || 
    errorMessage.includes('value') || 
    errorDetails.includes('value')
  ) {
    return new ApiError(
      400, // Bad Request
      'Nieprawidłowa wartość budżetu - musi być liczbą większą od zera',
      CampaignBudgetErrorCodes.INVALID_BUDGET_AMOUNT,
      {
        ...baseError.details,
        hint: 'Sprawdź, czy wartość budżetu jest poprawną liczbą większą od zera'
      }
    );
  }
  else if (errorMessage.includes('delivery method') || errorDetails.includes('delivery method')) {
    return new ApiError(
      400, // Bad Request
      'Nieprawidłowa metoda dostarczania budżetu',
      CampaignBudgetErrorCodes.DELIVERY_METHOD_INVALID,
      {
        ...baseError.details,
        hint: 'Metoda dostarczania musi być jedną z wartości: STANDARD, ACCELERATED'
      }
    );
  }
  else if (errorMessage.includes('name') || errorDetails.includes('name')) {
    return new ApiError(
      400, // Bad Request
      'Nazwa budżetu jest wymagana',
      CampaignBudgetErrorCodes.BUDGET_NAME_REQUIRED,
      baseError.details
    );
  }
  else if (errorMessage.includes('not found') || errorDetails.includes('not found')) {
    return new ApiError(
      404, // Not Found
      'Budżet kampanii nie został znaleziony',
      CampaignBudgetErrorCodes.BUDGET_NOT_FOUND,
      baseError.details
    );
  }

  // Jeśli nie jest to błąd specyficzny dla budżetów kampanii,
  // zwracamy ogólny błąd Google Ads
  return baseError;
}

/**
 * Tworzy funkcję middleware do obsługi błędów operacji na budżetach kampanii
 */
export function campaignBudgetErrorHandler(fn: Function) {
  return async (req: any, res: any, next: any) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error('Campaign Budget API error:', error);
      
      const apiError = handleCampaignBudgetError(error);
      
      return res.status(apiError.statusCode).json({
        success: false,
        error: {
          code: apiError.code,
          message: apiError.message,
          details: apiError.details
        }
      });
    }
  };
}