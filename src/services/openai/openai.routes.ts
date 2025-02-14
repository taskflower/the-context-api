// src/services/openai/openai.routes.ts
import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware";

import { handleChatCompletion } from "./openai";

const router = Router();

// OpenAI chat completion endpoint z autoryzacją i weryfikacją tokenów
router.post(
  "/chat/completion",
  verifyToken,
  handleChatCompletion
);

export default router;
