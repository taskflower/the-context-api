// src/services/openai/openai.config.ts
import OpenAI from 'openai';
import { UserService } from '../user/user.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface InitializeParams {
  messages: ChatMessage[];
  userId: string;
}

export interface ChatCompletionResult {
  message: ChatMessage;
  tokenUsage: number;
}

class OpenAIService {
  private openai: OpenAI;
  private userService: UserService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.userService = new UserService();
  }

  async getChatCompletion(params: InitializeParams): Promise<ChatCompletionResult> {
    if (!params.messages?.length || !params.userId) {
      throw new Error('Messages array and userId are required.');
    }

    // Check available tokens before making the request
    const availableTokens = await this.userService.checkAvailableTokens(params.userId);
    
    // Estimated limit - assuming maximum possible usage
    const MAX_ESTIMATED_TOKENS = 200; // Example value
    
    if (availableTokens < MAX_ESTIMATED_TOKENS) {
      throw new Error('Insufficient available tokens');
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: params.messages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    // Get actual token usage
    const tokenUsage = completion.usage?.total_tokens || 0;

    // Register token usage
    const success = await this.userService.registerTokenUsage(params.userId, tokenUsage);
    
    if (!success) {
      throw new Error('Failed to register token usage');
    }

    return {
      message: {
        role: 'assistant',
        content: completion.choices[0].message.content || ''
      },
      tokenUsage
    };
  }
}

export const openAIService = new OpenAIService();
