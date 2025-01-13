import { Router } from 'express';
import { handleAnalyzeWebsite } from '../services/analyzeWebsite/analyzeWebsite';

const router = Router();

router.post('/analyze-website/run', handleAnalyzeWebsite);

export default router;
