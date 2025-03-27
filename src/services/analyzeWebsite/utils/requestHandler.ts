// src/services/analyzeWebsite/utils/requestHandler.ts
import { Request, Response } from 'express';
import { WebsiteAnalysisService } from '../websiteAnalysis.service';
import { ResponseFormatter } from './responseFormatter';

type AnalysisFunction = 'getMarkdown' | 'getLinks' | 'getMetrics';

export const handleWebsiteAnalysisRequest = async (
  req: Request, 
  res: Response, 
  service: WebsiteAnalysisService,
  analysisFunction: AnalysisFunction,
  errorPrefix: string
) => {
  const { messages } = req.body;
  
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({
      success: false,
      data: {
        message: {
          role: "assistant",
          content: "# Error\n\nMessages array is required and must not be empty."
        },
        tokenUsage: {
          cost: res.locals.tokenCost || 0,
          remaining: res.locals.remainingTokens || 8000
        }
      }
      
    });
    return;
  }
  
  const userMessage = messages.find(msg => msg.role === 'user');
  const url = userMessage?.content;
  
  if (!url || typeof url !== 'string') {
    res.status(400).json({
      success: false,
      data: {
        message: {
          role: "assistant",
          content: "# Error\n\nValid URL is required in the user message content."
        },
        tokenUsage: {
          cost: res.locals.tokenCost || 0,
          remaining: res.locals.remainingTokens || 8000
        }
      }
    });
    return;
  }

  try {
    const result = await service[analysisFunction](url);
    ResponseFormatter.formatResponse(res, result);
  } catch (error) {
    res.status(500).json({
      success: false,
      data: {
        message: {
          role: "assistant",
          content: `# Error\n\n${errorPrefix}: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
        },
        tokenUsage: {
          cost: res.locals.tokenCost || 0,
          remaining: res.locals.remainingTokens || 8000
        }
      }
    });
  }
};