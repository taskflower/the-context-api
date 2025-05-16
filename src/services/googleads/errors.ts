// src/services/googleads/errors.ts

import { ApiError, ErrorCodes as BaseErrorCodes } from '../../errors/errors.utilsts';

// Rozszerzamy podstawowe kody błędów dla Google Ads API
export enum GoogleAdsErrorCodes {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_GRANT = 'INVALID_GRANT',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  REQUEST_ERROR = 'REQUEST_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

// Łączymy BaseErrorCodes i GoogleAdsErrorCodes dla wygody
export const ErrorCodes = {
  ...BaseErrorCodes,
  ...GoogleAdsErrorCodes
};

/**
 * Obsługuje podstawowe błędy Google Ads API i formatuje je jako ApiError
 * @param error Oryginalny błąd z Google Ads API
 * @returns Sformatowany obiekt ApiError
 */
export function handleGoogleAdsError(error: any): ApiError {
  // Domyślne wartości
  let statusCode = 500;
  let errorCode: string = BaseErrorCodes.INTERNAL_ERROR;
  let errorMessage = 'Błąd podczas komunikacji z Google Ads API';
  let details: any = { 
    // Zapisujemy tylko istotne informacje o błędzie, bez pełnego stack trace
    originalError: {
      message: error.message,
      code: error.code,
      details: error.details
    }
  };

  // Wyodrębnij kod błędu i szczegóły
  const errorDetails = error.details || '';
  const errorMessage2 = error.message || '';
  const errorCodeNumber = error.code || 0;

  // Sprawdź błędy autoryzacji
  if (
    errorDetails.includes('invalid_grant') || 
    errorMessage2.includes('invalid_grant')
  ) {
    statusCode = 401;
    errorCode = GoogleAdsErrorCodes.INVALID_GRANT;
    errorMessage = 'Błąd autoryzacji - token odświeżania jest nieprawidłowy lub wygasł';
    details = {
      ...details,
      hint: 'Należy ponownie autoryzować aplikację lub sprawdzić poprawność tokenów'
    };
  } 
  // Błędy autoryzacji - ogólne
  else if (
    errorDetails.includes('authentication') || 
    errorDetails.includes('unauthorized') || 
    errorCodeNumber === 16 ||
    errorMessage2.includes('authentication') ||
    errorMessage2.includes('unauthorized')
  ) {
    statusCode = 401;
    errorCode = GoogleAdsErrorCodes.AUTHENTICATION_ERROR;
    errorMessage = 'Błąd autoryzacji przy komunikacji z Google Ads API';
    details = {
      ...details,
      hint: 'Sprawdź poprawność credentials (developer token, client id/secret)'
    };
  } 
  // Zasoby nie znalezione
  else if (
    errorDetails.includes('not found') || 
    errorCodeNumber === 5 ||
    errorMessage2.includes('not found')
  ) {
    statusCode = 404;
    errorCode = GoogleAdsErrorCodes.RESOURCE_NOT_FOUND;
    errorMessage = 'Żądany zasób nie został znaleziony';
  } 
  // Błędy wejścia
  else if (
    errorDetails.includes('invalid') || 
    errorDetails.includes('bad request') || 
    errorCodeNumber === 3 ||
    errorMessage2.includes('invalid')
  ) {
    statusCode = 400;
    errorCode = GoogleAdsErrorCodes.INVALID_INPUT;
    errorMessage = 'Nieprawidłowe dane wejściowe';
  } 
  // Przekroczenie limitu zapytań
  else if (
    errorDetails.includes('quota') || 
    errorCodeNumber === 8 ||
    errorMessage2.includes('quota')
  ) {
    statusCode = 429;
    errorCode = GoogleAdsErrorCodes.QUOTA_EXCEEDED;
    errorMessage = 'Przekroczono limit zapytań do Google Ads API';
    details = {
      ...details,
      hint: 'Spróbuj ponownie za kilka minut lub zwiększ limity w Google Ads Console'
    };
  }
  // Błędy zapytania
  else if (errorCodeNumber === 2) {
    statusCode = 400;
    errorCode = GoogleAdsErrorCodes.REQUEST_ERROR;
    errorMessage = 'Błąd w zapytaniu do Google Ads API';
  }

  // Sprawdź, czy jest to błąd Google Ads API z dodatkowymi szczegółami
  if (error && error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    const googleAdsError = error.errors[0];
    errorMessage = googleAdsError.message || errorMessage;
    details = {
      ...details,
      googleAdsError: {
        error_code: googleAdsError.error_code,
        trigger: googleAdsError.trigger,
        location: googleAdsError.location
      },
      request_id: error.request_id
    };
  }

  return new ApiError(statusCode, errorMessage, errorCode, details);
}

/**
 * Tworzy middleware do obsługi ogólnych błędów Google Ads API
 */
export function googleAdsErrorHandler(fn: Function) {
  return async (req: any, res: any, next: any) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error('Google Ads API error:', error);
      
      const apiError = handleGoogleAdsError(error);
      
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

/**
 * Formatuje stack trace do bardziej czytelnej formy
 * Usuwa niepotrzebne części stack trace i zostawia tylko istotne informacje
 */
export function formatStackTrace(stack: string): string {
  if (!stack) return '';
  
  // Dzielimy stack trace na linie
  const lines = stack.split('\n');
  
  // Filtrujemy linie, aby usunąć niepotrzebne części
  const filteredLines = lines
    .filter(line => !line.includes('node_modules/@grpc/grpc-js'))
    .filter(line => !line.includes('node_modules/google-gax'))
    .filter(line => !line.includes('node:internal/process/task_queues'))
    .slice(0, 5); // Zostawiamy tylko 5 pierwszych linii
  
  // Łączymy z powrotem
  return filteredLines.join('\n');
}