// src/services/gemini/gemini.routes.ts
import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware";

import { handleChatCompletion } from "./gemini";

const router = Router();

// Gemini chat completion endpoint with authorization and token verification
router.post(
  "/chat/completion",
  verifyToken,
  handleChatCompletion
);

export default router;