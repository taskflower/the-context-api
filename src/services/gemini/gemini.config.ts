// src/services/gemini/gemini.config.ts
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
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
  tokenUsage: number; // Note: Gemini might not provide exact token counts like OpenAI
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private userService: UserService;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // Using the free Gemini model
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
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

    // Convert OpenAI-style messages to Gemini format
    const chat = this.model.startChat({
      history: this.convertToGeminiHistory(params.messages),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    // Generate response
    const result = await chat.sendMessage(this.getLastUserMessage(params.messages));
    const responseText = result.response.text();

    // Estimate token usage (Note: Gemini API doesn't provide exact token counts)
    // We're using a rough estimate based on characters
    const estimatedTokens = Math.ceil((
      params.messages.reduce((acc, msg) => acc + msg.content.length, 0) + 
      responseText.length
    ) / 4); // Rough estimate: ~4 chars per token

    // Register token usage
    const success = await this.userService.registerTokenUsage(params.userId, estimatedTokens);
    
    if (!success) {
      throw new Error('Failed to register token usage');
    }

    return {
      message: {
        role: 'assistant',
        content: responseText
      },
      tokenUsage: estimatedTokens
    };
  }

  private convertToGeminiHistory(messages: ChatMessage[]) {
    // Filter out system messages as Gemini handles them differently
    // For simplicity, we're ignoring system messages in this implementation
    const conversationHistory: {role: 'user' | 'model', parts: {text: string}[]}[] = [];
    
    for (const message of messages) {
      if (message.role === 'system') continue;
      
      conversationHistory.push({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }]
      });
    }
    
    // Remove the last user message as it will be sent separately
    if (conversationHistory.length > 0 && 
        conversationHistory[conversationHistory.length - 1].role === 'user') {
      conversationHistory.pop();
    }
    
    return conversationHistory;
  }

  private getLastUserMessage(messages: ChatMessage[]): {text: string}[] {
    // Get the last user message to send
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return [{ text: messages[i].content }];
      }
    }
    return [{ text: '' }];
  }
}

export const geminiService = new GeminiService();