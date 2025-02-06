// src/services/analyzeWebsite/analyzeWebsite.config.ts
import { WebPageAnalyzer } from '../../utils/webAnalyzer';
import admin from '../../config/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// src/services/analyzeWebsite/types.ts
export interface InitializeParams {
    url: string;
    userId: string;
}

export interface AnalysisResult {
    id: string;
    url: string;
    status: 'completed' | 'failed' | 'in_progress';
}

class WebsiteAnalysisService {
    private analyzer: WebPageAnalyzer | null = null;
    private db: FirebaseFirestore.Firestore;
    
    constructor() {
        this.db = admin.firestore();
    }

    private async initializeAnalyzer() {
        if (!this.analyzer) {
            this.analyzer = await WebPageAnalyzer.create(
                path.join(__dirname, '../../../dictionaries')
            );
        }
        return this.analyzer;
    }

    private async createOrUpdateDocument(
        url: string, 
        userId: string
    ): Promise<FirebaseFirestore.DocumentReference> {
        const websitesCollection = this.db.collection('websites');
        let documentRef = websitesCollection.doc();

        await this.db.runTransaction(async (transaction) => {
            const querySnapshot = await transaction.get(
                websitesCollection.where('url', '==', url).limit(1)
            );

            if (!querySnapshot.empty) {
                documentRef = querySnapshot.docs[0].ref;
            }

            transaction.set(documentRef, {
                url,
                userId,
                timestamp: admin.firestore.Timestamp.now(),
                status: 'in_progress',
            });
        });

        return documentRef;
    }

    private async saveError(params: InitializeParams, error: unknown): Promise<void> {
        const errorRef = this.db.collection('websites').doc(uuidv4());
        await errorRef.set({
            url: params.url,
            userId: params.userId,
            status: 'failed',
            error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: admin.firestore.Timestamp.now(),
            },
        });
    }

    async analyzeWebsite(params: InitializeParams): Promise<AnalysisResult> {
        if (!params.url || !params.userId) {
            throw new Error('URL i userId są wymagane.');
        }

        try {
            const analyzer = await this.initializeAnalyzer();
            const documentRef = await this.createOrUpdateDocument(params.url, params.userId);

            const [{ markdown, images }, links, metrics] = await Promise.all([
                analyzer.htmlToMarkdown(params.url),
                analyzer.collectLinks(params.url),
                analyzer.analyzeTextMetrics(params.url),
            ]);

            const linksAnalysis = {
                total: links.length,
                external: links.filter((l) => l.isExternal).length,
                internal: links.filter((l) => !l.isExternal).length,
                withImages: links.filter((l) => l.hasImage).length,
                items: links,
            };

            await documentRef.set(
                {
                    markdown,
                    images,
                    links: linksAnalysis,
                    metrics,
                    status: 'completed',
                    timestamp: admin.firestore.Timestamp.now(),
                },
                { merge: true }
            );

            return {
                id: documentRef.id,
                url: params.url,
                status: 'completed'
            };

        } catch (error) {
            console.error('Błąd analizy strony:', error);
            await this.saveError(params, error);
            throw error;
        }
    }
}

export const websiteAnalysisService = new WebsiteAnalysisService();