import { Router } from 'express';
import { handleAnalyzeWebsite } from '../services/analyzeWebsite/analyzeWebsite';
import { handleChatCompletion } from '../services/openai/openai';

const router = Router();

// Website analysis endpoint
router.post('/analyze-website/run', handleAnalyzeWebsite);

// OpenAI chat completion endpoint
router.post('/chat/completion', handleChatCompletion);

export default router;