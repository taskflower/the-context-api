// webAnalyzer.ts
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

import { SentimentAnalyzer } from './sentimentAnalyzer';
import { TextProcessor } from './textProcessor';
import { DictionaryLoader } from './dictionaryLoader';

// types.ts
export interface SentimentDictionary {
    [word: string]: number;
}

export interface DictionarySet {
    positive: SentimentDictionary;
    negative: SentimentDictionary;
}

export interface CompleteWordDictionary {
    sentiment: DictionarySet;
    stopwords: string[];
}

export interface LinkInfo {
    url: string;
    text: string;
    isExternal: boolean;
    hasImage: boolean;
}

export interface ImageInfo {
    altText: string;
}

export interface TextMetrics {
    wordCount: number;
    charCount: number;
    paragraphCount: number;
    headingsCount: number;
    averageWordLength: number;
    sentiment: {
        score: number;
        comparative: number;
        keywords: { word: string; sentiment: number }[];
    };
    language: string;
}

export interface SentimentResult {
    score: number;
    details: Array<{ word: string; score: number }>;
}

export class WebPageAnalyzer {
    private readonly turndownService: TurndownService;
    private readonly dictionaries: Record<string, CompleteWordDictionary> | null = null;
    private static instance: WebPageAnalyzer | null = null;

    private constructor(dictionaries: Record<string, CompleteWordDictionary> | null) {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            bulletListMarker: '-',
        });
        this.dictionaries = dictionaries;
    }

    static async create(dictionaryPath: string): Promise<WebPageAnalyzer> {
        if (!WebPageAnalyzer.instance) {
            const dictionaries = await DictionaryLoader.loadDictionaries(dictionaryPath);
            WebPageAnalyzer.instance = new WebPageAnalyzer(dictionaries);
        }
        return WebPageAnalyzer.instance;
    }

    private async fetchPage(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        return response.text();
    }

    async analyzeTextMetrics(url: string): Promise<TextMetrics> {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);
        
        $('script, style, meta, link').remove();
        
        const rawLanguage = $('html').attr('lang') || 'pl';
        const language = rawLanguage.split('-')[0].toLowerCase();
        
        const text = $('body').text().trim();
        const words = TextProcessor.tokenize(text);
        const chars = text.replace(/\s/g, '');
        
        if (words.length === 0) {
            throw new Error('No text content found on the page.');
        }
        
        const stopwords = this.dictionaries?.[language]?.stopwords || [];
        const filteredWords = TextProcessor.removeStopwords(words, stopwords);
        
        let sentiment = {
            score: 0,
            comparative: 0,
            keywords: [] as { word: string; sentiment: number }[]
        };

        if (this.dictionaries?.[language]?.sentiment) {
            const analyzer = new SentimentAnalyzer(
                Object.fromEntries(
                    Object.entries(this.dictionaries).map(([lang, dict]) => [lang, dict.sentiment])
                )
            );
            const sentimentResult = analyzer.analyze(filteredWords, language);
            sentiment = {
                score: sentimentResult.score,
                comparative: sentimentResult.score / filteredWords.length,
                keywords: Array.from(new Set(filteredWords)).map(word => ({
                    word,
                    sentiment: sentimentResult.details.find(d => d.word === word)?.score || 0
                }))
            };
        }
        
        return {
            wordCount: words.length,
            charCount: chars.length,
            paragraphCount: $('p').length,
            headingsCount: $('h1, h2, h3, h4, h5, h6').length,
            averageWordLength: chars.length / words.length,
            sentiment,
            language: rawLanguage,
        };
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
}