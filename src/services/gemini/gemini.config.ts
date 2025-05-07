// src/services/gemini/gemini.config.ts
import { enhanceMessagesWithSchemaInstructions } from './schema-instruction';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { UserService } from '../user/user.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface InitializeParams {
  messages: ChatMessage[];
  userId: string;
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    response_mime_type?: string;
    responseSchema?: any; // Schema support
  };
}

export interface ChatCompletionResult {
  message: ChatMessage;
  result?: any; // Parsed result for JSON responses
  tokenUsage: number;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private userService: UserService;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    this.userService = new UserService();
  }

  async getChatCompletion(params: InitializeParams): Promise<ChatCompletionResult> {
    if (!params.messages?.length || !params.userId) {
      throw new Error('Messages array and userId are required.');
    }

    // Check available tokens
    const availableTokens = await this.userService.checkAvailableTokens(params.userId);
    const MAX_ESTIMATED_TOKENS = 200;
    
    if (availableTokens < MAX_ESTIMATED_TOKENS) {
      throw new Error('Insufficient available tokens');
    }

    // Zastosuj generator instrukcji oparty o schemat
    let processedMessages = [...params.messages];
    if (params.generationConfig?.responseSchema) {
      processedMessages = enhanceMessagesWithSchemaInstructions(
        processedMessages, 
        params.generationConfig.responseSchema
      );
      
      console.log('Enhanced messages with schema instructions');
    }

    // Convert messages to Gemini format
    const chat = this.model.startChat({
      history: this.convertToGeminiHistory(processedMessages),
      generationConfig: {
        temperature: params.generationConfig?.temperature ?? 0.7,
        maxOutputTokens: params.generationConfig?.maxOutputTokens ?? 4096,
        topP: params.generationConfig?.topP,
        topK: params.generationConfig?.topK,
        responseMimeType: params.generationConfig?.responseSchema ? 'application/json' : undefined
      },
    });

    // Generate response
    const result = await chat.sendMessage(this.getLastUserMessage(processedMessages));
    const responseText = result.response.text();

    // Estimate token usage
    const estimatedTokens = Math.ceil((
      processedMessages.reduce((acc, msg) => acc + msg.content.length, 0) + 
      responseText.length
    ) / 4);

    // Register token usage
    const success = await this.userService.registerTokenUsage(params.userId, estimatedTokens);
    
    if (!success) {
      throw new Error('Failed to register token usage');
    }

    // Handle JSON parsing for structured responses
    let parsedResult: any = null;
    if (params.generationConfig?.responseSchema) {
      try {
        // Clean the response text to handle potential formatting issues
        const cleanedJson = this.cleanJsonResponse(responseText);
        parsedResult = JSON.parse(cleanedJson);
        console.log('Successfully parsed JSON response', { parsed: true });
      } catch (error) {
        console.error('Error parsing JSON response:', error);
        throw new Error('Failed to parse LLM response as JSON');
      }
    }

    return {
      message: {
        role: 'assistant',
        content: responseText
      },
      result: parsedResult,
      tokenUsage: estimatedTokens
    };
  }

  // Clean up potential issues in JSON response
  private cleanJsonResponse(text: string): string {
    // Remove markdown code fences if present
    let cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    // Remove any explanatory text before or after JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart >= 0 && jsonEnd >= 0) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    return cleaned;
  }

  private convertToGeminiHistory(messages: ChatMessage[]) {
    const conversationHistory: {role: 'user' | 'model', parts: {text: string}[]}[] = [];
    let systemPrompts: string[] = [];
    
    // Collect system messages for inclusion in first user message
    for (const message of messages) {
      if (message.role === 'system') {
        systemPrompts.push(message.content);
        continue;
      }
      
      conversationHistory.push({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }]
      });
    }
    
    // If we have system prompts and a user message, prepend system prompts to the first user message
    if (systemPrompts.length > 0 && conversationHistory.length > 0 && conversationHistory[0].role === 'user') {
      const combinedContent = `${systemPrompts.join('\n\n')}\n\n${conversationHistory[0].parts[0].text}`;
      conversationHistory[0].parts[0].text = combinedContent;
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