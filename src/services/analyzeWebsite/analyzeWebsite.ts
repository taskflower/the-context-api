import { analyzeWebsite } from './analyzeWebsite.config';
import { Request, Response } from 'express';

export async function handleAnalyzeWebsite(req: Request, res: Response): Promise<void> {
  const { url, userId } = req.body;

  if (!url || typeof url !== 'string') {
    res.status(400).json({
      error: 'URL jest wymagany i musi być ciągiem znaków.',
    });
    return;
  }

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({
      error: 'userId jest wymagany i musi być ciągiem znaków.',
    });
    return;
  }

  try {
    const result = await analyzeWebsite({ url, userId });

    res.status(200).json({
      message: 'Analiza strony zakończona sukcesem.',
      result,
    });
  } catch (error) {
    console.error('Błąd analizy strony:', error);

    res.status(500).json({
      error: 'Błąd serwisu Website Analysis',
      message: error instanceof Error ? error.message : 'Nieznany błąd',
    });
  }
}
