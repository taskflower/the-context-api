// src/services/openai/openai.config.ts
import OpenAI from 'openai';
import admin from '../../config/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface InitializeParams {
    messages: ChatMessage[];
    userId: string;
}

export interface ChatCompletionResult {
    id: string;
    status: 'completed' | 'failed' | 'in_progress';
    response?: ChatMessage;
}

class OpenAIService {
    private openai: OpenAI;
    private db: FirebaseFirestore.Firestore;
    
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.db = admin.firestore();
    }

    private async createDocument(
        messages: ChatMessage[], 
        userId: string
    ): Promise<FirebaseFirestore.DocumentReference> {
        const chatCollection = this.db.collection('chat_completions');
        const documentRef = chatCollection.doc();

        await documentRef.set({
            messages,
            userId,
            timestamp: admin.firestore.Timestamp.now(),
            status: 'in_progress',
        });

        return documentRef;
    }

    private async saveError(params: InitializeParams, error: unknown): Promise<void> {
        const errorRef = this.db.collection('chat_completions').doc(uuidv4());
        await errorRef.set({
            messages: params.messages,
            userId: params.userId,
            status: 'failed',
            error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: admin.firestore.Timestamp.now(),
            },
        });
    }

    async getChatCompletion(params: InitializeParams): Promise<ChatCompletionResult> {
        if (!params.messages?.length || !params.userId) {
            throw new Error('Messages array and userId are required.');
        }

        try {
            const documentRef = await this.createDocument(params.messages, params.userId);

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: params.messages,
                temperature: 0.7,
                max_tokens: 2000,
            });

            const response: ChatMessage = {
                role: 'assistant',
                content: completion.choices[0].message.content || ''
            };

            await documentRef.set(
                {
                    response,
                    status: 'completed',
                    completedAt: admin.firestore.Timestamp.now(),
                    usage: completion.usage,
                },
                { merge: true }
            );

            return {
                id: documentRef.id,
                status: 'completed',
                response
            };

        } catch (error) {
            console.error('Chat completion error:', error);
            await this.saveError(params, error);
            throw error;
        }
    }
}

export const openAIService = new OpenAIService();