// src/services/analyzeWebsite/routes/links.routes.ts
import { Router, Request, Response } from 'express';
import { WebsiteAnalysisService } from '../websiteAnalysis.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { permanentTokenConsumption } from '../../../middleware/token-usage.middleware';
import { verifyToken } from '../../../middleware/auth.middleware';

const router = Router();
const service = new WebsiteAnalysisService();

router.get(
  '/analyze-website/links', 
  verifyToken,
  permanentTokenConsumption(60),
  async (req: Request, res: Response) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      res.status(400).json({
        role: "assistant",
        content: "# Error\n\nURL jest wymagany."
      });
      return;
    }

    try {
      const result = await service.getLinks(url);
      ResponseFormatter.formatResponse(res, result);
    } catch (error) {
      res.status(500).json({
        role: "assistant",
        content: `# Error\n\nBłąd analizy linków: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      });
    }
});

export default router;