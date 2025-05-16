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
  let url = userMessage?.content;
  
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

  // Simple URL validation and normalization
  try {
    // Remove whitespace
    url = url.trim();
    
    // Check if URL starts with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Try to create a URL object (will throw if invalid)
    new URL(url);
  } catch (e) {
    res.status(400).json({
      success: false,
      data: {
        message: {
          role: "assistant",
          content: `# Error\n\nInvalid URL format: ${url}`
        },
        tokenUsage: {
          cost: res.locals.tokenCost || 0,
          remaining: res.locals.remainingTokens || 8000
        }
      }
    });
    return;
  }

  // Add timeout for long-running requests
  const timeout = setTimeout(() => {
    res.status(504).json({
      success: false,
      data: {
        message: {
          role: "assistant",
          content: `# Error\n\nRequest timed out. The website may be too large or unavailable.`
        },
        tokenUsage: {
          cost: res.locals.tokenCost || 0,
          remaining: res.locals.remainingTokens || 8000
        }
      }
    });
  }, 30000); // 30 second timeout

  try {
    const result = await service[analysisFunction](url);
    clearTimeout(timeout);
    ResponseFormatter.formatResponse(res, result);
  } catch (error) {
    clearTimeout(timeout);
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
