// src/services/google-oauth/google-oauth.routes.ts
import { Router, Response, Request, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { ApiError, ErrorCodes } from '../../errors/errors.utilsts';

const router = Router();

// Upewnij się, że ten adres URL jest DOKŁADNIE taki sam jak w konsoli Google Cloud
// w ustawieniach Authorized redirect URIs
const REDIRECT_URI = 'http://localhost:3000/api/v1/google-oauth/callback';

// Utworzenie klienta OAuth
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_ADS_CLIENT_ID,
  process.env.GOOGLE_ADS_CLIENT_SECRET,
  REDIRECT_URI
);

// Trasa do inicjowania procesu OAuth - bez weryfikacji tokenu
router.get('/auth', (req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/adwords'],
    prompt: 'consent', // Wymuś wygenerowanie nowego tokenu odświeżania
    redirect_uri: REDIRECT_URI // Jawne określenie adresu przekierowania
  });
  
  // Przekieruj użytkownika lub zwróć URL
  if (req.query.return_url === 'true') {
    res.status(200).json({
      success: true,
      data: {
        auth_url: url
      }
    });
  } else {
    res.redirect(url);
  }
});

// Wrapper dla asynchronicznych handlerów tras
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Trasa callback dla OAuth - też bez weryfikacji tokenu
router.get('/callback', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      throw new ApiError(
        400,
        'Brak kodu autoryzacji',
        ErrorCodes.INVALID_INPUT
      );
    }
    
    const { tokens } = await oauth2Client.getToken({
      code: code,
      redirect_uri: REDIRECT_URI // Upewnij się, że używasz tego samego URI
    });
    
    // Zwróć JSON z tokenem odświeżania
    res.status(200).json({
      success: true,
      data: {
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date
      }
    });
  } catch (error) {
    console.error('OAuth error:', error);
    next(error);
  }
}));

export default router;