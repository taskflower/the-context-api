// src/services/gemini/gemini.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { geminiService, ChatMessage } from "./gemini.config";
import { ApiError, ErrorCodes } from "../../errors/errors.utilsts";

// Dodaj brakujący kod błędu, jeśli go nie ma
declare module "../../errors/errors.utilsts" {
  export interface ErrorCodes {
    INVALID_LLM_RESPONSE: string;
  }
}

// Dodajemy kod błędu, jeśli nie istnieje w ErrorCodes
if (!ErrorCodes.hasOwnProperty('INVALID_LLM_RESPONSE')) {
  (ErrorCodes as any).INVALID_LLM_RESPONSE = "INVALID_LLM_RESPONSE";
}

export async function handleChatCompletion(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { messages, generationConfig } = req.body;
    const userId = req.user?.uid;

    if (!Array.isArray(messages) || messages.length === 0) {
      return next(
        new ApiError(
          400,
          "Messages array is required and must not be empty.",
          ErrorCodes.INVALID_INPUT
        )
      );
    }

    if (!userId) {
      return next(
        new ApiError(
          401,
          "User authentication required.",
          ErrorCodes.UNAUTHORIZED
        )
      );
    }

    // Validate message format
    const isValidMessageFormat = messages.every(
      (msg: any) =>
        typeof msg === "object" &&
        ["system", "user", "assistant"].includes(msg.role) &&
        typeof msg.content === "string"
    );

    if (!isValidMessageFormat) {
      return next(
        new ApiError(
          400,
          "Invalid message format. Each message must have a valid role and content.",
          ErrorCodes.INVALID_INPUT
        )
      );
    }

    // Forward the generation config from the request
    const completionResult = await geminiService.getChatCompletion({
      messages: messages as ChatMessage[],
      userId,
      generationConfig: generationConfig || {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    // Log dla debugowania
    console.log("Processed request, responding with:", {
      success: true,
      result: completionResult.result ? 'Present' : 'Not present',
      message: completionResult.message ? 'Present' : 'Not present'
    });

    // Return both the raw message and parsed result if available
    res.status(200).json({
      success: true,
      result: completionResult.result, // Send the parsed JSON result
      data: {
        message: completionResult.message,
        tokenUsage: completionResult.tokenUsage,
      },
    });
  } catch (error) {
    console.error("Chat completion error:", error);

    if (
      error instanceof Error &&
      error.message === "Insufficient available tokens"
    ) {
      return next(
        new ApiError(
          403,
          "Insufficient tokens to perform the operation",
          ErrorCodes.INSUFFICIENT_TOKENS
        )
      );
    }

    if (error instanceof Error && 
        error.message === "Failed to parse LLM response as JSON") {
      return next(
        new ApiError(
          422,
          "Failed to parse LLM response as JSON. Check your schema.",
          (ErrorCodes as any).INVALID_LLM_RESPONSE
        )
      );
    }

    if (error instanceof ApiError) {
      return next(error);
    }

    return next(
      new ApiError(
        500,
        "Gemini Service Error",
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Unknown error occurred"
      )
    );
  }
}