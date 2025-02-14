// src/services/openai/openai.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { openAIService, ChatMessage } from './openai.config';
import { ApiError, ErrorCodes } from '../../errors/errors.utilsts';

export async function handleChatCompletion(
    req: AuthRequest, 
    res: Response, 
    next: NextFunction
): Promise<void> {
    try {
        const { messages } = req.body;
        const userId = req.user?.uid;

        if (!Array.isArray(messages) || messages.length === 0) {
            return next(new ApiError(
                400,
                'Messages array is required and must not be empty.',
                ErrorCodes.INVALID_INPUT
            ));
        }

        if (!userId) {
            return next(new ApiError(
                401,
                'User authentication required.',
                ErrorCodes.UNAUTHORIZED
            ));
        }

        // Validate message format
        const isValidMessageFormat = messages.every((msg: any) => 
            typeof msg === 'object' &&
            ['system', 'user', 'assistant'].includes(msg.role) &&
            typeof msg.content === 'string'
        );

        if (!isValidMessageFormat) {
            return next(new ApiError(
                400,
                'Invalid message format. Each message must have a valid role and content.',
                ErrorCodes.INVALID_INPUT
            ));
        }

        const result = await openAIService.getChatCompletion({ 
            messages: messages as ChatMessage[], 
            userId 
        });

        res.status(200).json({
            success: true,
            data: {
                message: result.message,
                tokenUsage: result.tokenUsage
            }
        });
    } catch (error) {
        console.error('Chat completion error:', error);
        
        if (error instanceof Error && error.message === 'Insufficient available tokens') {
            return next(new ApiError(
                403,
                'Insufficient tokens to perform the operation',
                ErrorCodes.INSUFFICIENT_TOKENS
            ));
        }

        if (error instanceof ApiError) {
            return next(error);
        }

        return next(new ApiError(
            500,
            'OpenAI Service Error',
            ErrorCodes.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Unknown error occurred'
        ));
    }
}