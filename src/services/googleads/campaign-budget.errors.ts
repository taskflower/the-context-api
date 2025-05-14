// src/services/googleads/campaign-budget.errors.ts
import { ApiError, ErrorCodes } from '../../errors/errors.utilsts';

// Rozszerzamy kody błędów dla budżetów kampanii
export enum CampaignBudgetErrorCodes {
  BUDGET_ALREADY_EXISTS = 'BUDGET_ALREADY_EXISTS'
}

/**
 * Obsługuje błędy specyficzne dla budżetów kampanii
 * @param error Oryginalny błąd z Google Ads API
 * @returns Sformatowany obiekt ApiError
 */
export function handleCampaignBudgetError(error: any): ApiError {
  // Domyślne wartości
  let statusCode = 500;
  let errorCode: string = ErrorCodes.INTERNAL_ERROR; // Zmieniliśmy typ na string
  let errorMessage = 'Błąd podczas operacji na budżecie kampanii';
  let details: any = { originalError: error };

  // Sprawdź, czy to jest błąd Google Ads API
  if (error && error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    const googleAdsError = error.errors[0];
    errorMessage = googleAdsError.message || errorMessage;
    details = {
      googleAdsError: {
        error_code: googleAdsError.error_code,
        trigger: googleAdsError.trigger,
        location: googleAdsError.location
      },
      request_id: error.request_id
    };

    // Mapowanie błędów specyficznych dla budżetów kampanii
    if (errorMessage.includes('already exists')) {
      statusCode = 409;
      errorCode = CampaignBudgetErrorCodes.BUDGET_ALREADY_EXISTS; // Używamy enum
      errorMessage = 'Budżet kampanii o tej nazwie już istnieje';
    } else if (errorMessage.includes('amount') || errorMessage.includes('value')) {
      statusCode = 400;
      errorCode = ErrorCodes.INVALID_INPUT;
      errorMessage = 'Nieprawidłowa wartość budżetu';
    } else if (errorMessage.includes('not found')) {
      statusCode = 404;
      errorCode = ErrorCodes.NOT_FOUND;
      errorMessage = 'Budżet kampanii nie został znaleziony';
    } else if (errorMessage.includes('invalid')) {
      statusCode = 400;
      errorCode = ErrorCodes.INVALID_INPUT;
      errorMessage = 'Nieprawidłowe dane budżetu kampanii';
    }
  }

  return new ApiError(statusCode, errorMessage, errorCode, details);
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