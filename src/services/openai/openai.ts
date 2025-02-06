// src/services/openai/openai.ts
import { Request, Response } from 'express';
import { openAIService } from './openai.config';

export async function handleChatCompletion(req: Request, res: Response): Promise<void> {
    const { messages, userId } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({
            error: 'Messages array is required and must not be empty.',
        });
        return;
    }

    if (!userId || typeof userId !== 'string') {
        res.status(400).json({
            error: 'userId is required and must be a string.',
        });
        return;
    }

    try {
        const result = await openAIService.getChatCompletion({ messages, userId });
        res.status(200).json({
            message: 'Chat completion successful.',
            result,
        });
    } catch (error) {
        console.error('Chat completion error:', error);
        res.status(500).json({
            error: 'OpenAI Service Error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
