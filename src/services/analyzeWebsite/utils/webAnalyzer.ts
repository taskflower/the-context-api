// src/services/analyzeWebsite/utils/webAnalyzer.ts
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

// types.ts
export interface LinkInfo {
    url: string;
    text: string;
    isExternal: boolean;
    hasImage: boolean;
}

export interface ImageInfo {
    altText: string;
}

export interface PageMetrics {
    wordCount: number;
    charCount: number;
    paragraphCount: number;
    headingsCount: number;
    averageWordLength: number;
    sentiment: {
        score: number;
        comparative: number;
        keywords: Array<{ word: string; sentiment: number }>;
    };
    language: string;
}

export class WebPageAnalyzer {
    private readonly turndownService: TurndownService;
    private static instance: WebPageAnalyzer | null = null;

    private constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            bulletListMarker: '-',
        });
    }

    static async create(dictionaryPath: string): Promise<WebPageAnalyzer> {
        if (!WebPageAnalyzer.instance) {
            WebPageAnalyzer.instance = new WebPageAnalyzer();
        }
        return WebPageAnalyzer.instance;
    }

    private async fetchPage(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }
            return response.text();
        } catch (error) {
            throw new Error(`Nie można pobrać strony: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
        }
    }

    async htmlToMarkdown(url: string): Promise<{ markdown: string; images: ImageInfo[] }> {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);
        $('script, style, meta, link').remove();
    
        $('a').each((_, element) => {
            const $link = $(element);
            const linkText = $link.text();
            $link.replaceWith(linkText);
        });
    
        const images: ImageInfo[] = [];
        $('img').each((_, element) => {
            const $img = $(element);
            const altText = $img.attr('alt') || '';
            if (altText) {
                images.push({ altText });
            }
            $img.remove();
        });
    
        const markdown = this.turndownService.turndown($.html());
    
        return {
            markdown: markdown
                .replace(/\n\s*/g, '\n\n')
                .replace(/(#+\s*.+)/g, '\n$1\n')
                .replace(/\*\*(.+?)\*\*/g, '\n**$1**\n')
                .trim(),
            images,
        };
    }
    
    async collectLinks(url: string): Promise<LinkInfo[]> {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);
        const baseUrl = new URL(url);
        const links: LinkInfo[] = [];

        $('a').each((_, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            if (!href) return;

            try {
                const absoluteUrl = new URL(href, baseUrl.origin);
                const existingLink = links.find(link => link.url === absoluteUrl.toString());
                if (!existingLink) {
                    links.push({
                        url: absoluteUrl.toString(),
                        text: $link.text().trim(),
                        isExternal: absoluteUrl.hostname !== baseUrl.hostname,
                        hasImage: $link.find('img').length > 0,
                    });
                }
            } catch {
                // Ignore invalid URLs
            }
        });

        return links;
    }

    async analyzeMetrics(url: string): Promise<PageMetrics> {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);
        
        // Remove scripts, styles and hidden elements to get clean text
        $('script, style, meta, link, [style*="display:none"], [style*="display: none"]').remove();
        
        // Get all text content
        const textContent = $('body').text().trim();
        
        // Split into words and remove empty strings
        const words = textContent.split(/\s+/).filter(word => word.length > 0);
        
        // Count characters (excluding whitespace)
        const charCount = textContent.replace(/\s+/g, '').length;
        
        // Count paragraphs
        const paragraphCount = $('p').length || textContent.split(/\n\s*\n/).length;
        
        // Count headings
        const headingsCount = $('h1, h2, h3, h4, h5, h6').length;
        
        // Calculate average word length
        const totalCharacters = words.reduce((sum, word) => sum + word.length, 0);
        const averageWordLength = words.length > 0 ? totalCharacters / words.length : 0;
        
        // Simple sentiment analysis (basic implementation)
        // In a real implementation, you would use a proper sentiment analysis library
        const positiveWords = ['good', 'great', 'excellent', 'awesome', 'positive', 'happy', 'joy'];
        const negativeWords = ['bad', 'poor', 'terrible', 'negative', 'sad', 'anger', 'hate'];
        
        let sentimentScore = 0;
        const keywords: Array<{ word: string; sentiment: number }> = [];
        
        words.forEach(word => {
            const lowerWord = word.toLowerCase();
            if (positiveWords.includes(lowerWord)) {
                sentimentScore += 1;
                keywords.push({ word: lowerWord, sentiment: 1 });
            } else if (negativeWords.includes(lowerWord)) {
                sentimentScore -= 1;
                keywords.push({ word: lowerWord, sentiment: -1 });
            }
        });
        
        // Guess the language - simplified example
        const language = this.guessLanguage(textContent);
        
        return {
            wordCount: words.length,
            charCount,
            paragraphCount,
            headingsCount,
            averageWordLength: parseFloat(averageWordLength.toFixed(2)),
            sentiment: {
                score: sentimentScore,
                comparative: words.length > 0 ? parseFloat((sentimentScore / words.length).toFixed(3)) : 0,
                keywords: keywords.slice(0, 10) // Limit to top 10 keywords
            },
            language
        };
    }
    
    private guessLanguage(text: string): string {
        // Very simplified language detection - in a real app you would use a proper library
        const englishPattern = /\b(the|and|is|in|to|of|a|for|that|this)\b/gi;
        const polishPattern = /\b(jest|nie|to|się|w|na|z|do|że|i)\b/gi;
        const germanPattern = /\b(der|die|das|und|ist|in|zu|den|dem|ein)\b/gi;
        
        const englishMatches = (text.match(englishPattern) || []).length;
        const polishMatches = (text.match(polishPattern) || []).length;
        const germanMatches = (text.match(germanPattern) || []).length;
        
        if (englishMatches > polishMatches && englishMatches > germanMatches) return 'en';
        if (polishMatches > englishMatches && polishMatches > germanMatches) return 'pl';
        if (germanMatches > englishMatches && germanMatches > polishMatches) return 'de';
        
        return 'en'; // Default to English
    }
}