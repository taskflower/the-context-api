// src/services/analyzeWebsite/routes/metrics.routes.ts
import { Router } from 'express';
import { WebsiteAnalysisService } from '../websiteAnalysis.service';
import { handleWebsiteAnalysisRequest } from '../utils/requestHandler';
import { permanentTokenConsumption } from '../../../middleware/token-usage.middleware';
import { verifyToken } from '../../../middleware/auth.middleware';

const router = Router();
const service = new WebsiteAnalysisService();

// Only POST endpoint like OpenAI
router.post(
  '/analyze-website/metrics', 
  verifyToken,
  permanentTokenConsumption(70),
  (req, res) => handleWebsiteAnalysisRequest(req, res, service, 'getMetrics', 'Błąd analizy metryk')
);

export default router;