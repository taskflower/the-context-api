import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import natural from 'natural';

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

export class WebPageAnalyzer {
    private turndownService: TurndownService;
    private tokenizer: natural.WordTokenizer;

    constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            bulletListMarker: '-',
        });
        this.tokenizer = new natural.WordTokenizer();
    }

    // Stopwords for English and Polish
    private static STOPWORDS = {
        en: [
            "the", "and", "is", "in", "at", "of", "on", "to", "a", "an", "it", "this", "that", "for", "with", "as", "was", "by",
            "be", "are", "from", "but", "or", "if", "not", "they", "their", "has", "had", "have", "you", "your"
        ],
        pl: [
            "i", "oraz", "lub", "ale", "to", "jest", "na", "w", "z", "za", "do", "że", "czy", "tego", "tam", "tutaj", "od", "po",
            "przez", "jak", "tylko", "są", "będzie", "czyli", "mnie", "mam", "dla", "ten", "ta", "te", "tę", "nie", "ich", "czy"
        ]
    };

    // Function to tokenize Polish text
    private static tokenizePolishText(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^a-ząęćłńóśźż ]+/g, '') // Remove special characters
            .split(/\s+/); // Split into words
    }

    // Function to remove stopwords
    private static removeStopwords(words: string[], language: string): string[] {
        if (!(language in WebPageAnalyzer.STOPWORDS)) {
            console.warn(`Language not supported for stopwords: ${language}`);
            return words; // Return original list if language is not supported
        }

        const stopwords = WebPageAnalyzer.STOPWORDS[language as keyof typeof WebPageAnalyzer.STOPWORDS];
        return words.filter(word => !stopwords.includes(word));
    }

    // Basic sentiment calculation using dictionaries
    private static calculateSentiment(words: string[], language: string): number {
        const SENTIMENT_DICT = {
            en: {
                positive: ["good", "great", "nice", "fantastic"],
                negative: ["problem", "chaos", "bad", "terrible"]
            },
            pl: {
                positive: ["dobry", "świetny", "miły", "fantastyczny"],
                negative: ["problem", "chaos", "zły", "fatalny"]
            }
        };

        if (!(language in SENTIMENT_DICT)) {
            console.warn(`Sentiment analysis not supported for language: ${language}`);
            return 0; // Return neutral score if language is not supported
        }

        const languageDict = SENTIMENT_DICT[language as keyof typeof SENTIMENT_DICT];
        let score = 0;

        words.forEach(word => {
            if (languageDict.positive.includes(word)) score += 1;
            if (languageDict.negative.includes(word)) score -= 1;
        });

        return score;
    }

    private async fetchPage(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        return response.text();
    }

    async htmlToMarkdown(url: string): Promise<{ markdown: string; images: ImageInfo[] }> {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);
        $('script, style, meta, link').remove();
    
        // Remove links from the content
        $('a').each((_, element) => {
            const $link = $(element);
            const linkText = $link.text();
            $link.replaceWith(linkText); // Replace the link element with its text
        });
    
        // Collect images and remove them from the content
        const images: ImageInfo[] = [];
        $('img').each((_, element) => {
            const $img = $(element);
            const altText = $img.attr('alt') || '';
            if (altText) {
                images.push({ altText });
            }
            $img.remove(); // Remove image from the content
        });
    
        const markdown = this.turndownService.turndown($.html());
    
        return {
            markdown: markdown
                .replace(/\n\s*/g, '\n\n') // Add double newlines for better formatting
                .replace(/(#+\s*.+)/g, '\n$1\n') // Ensure headings have surrounding newlines
                .replace(/\*\*(.+?)\*\*/g, '\n**$1**\n') // Ensure bold text has newlines
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

    async analyzeTextMetrics(url: string): Promise<TextMetrics> {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);

        $('script, style, meta, link').remove();

        const rawLanguage = $('html').attr('lang') || 'unknown';
        const language = rawLanguage.split('-')[0].toLowerCase();

        const text = $('body').text().trim();
        const words = WebPageAnalyzer.tokenizePolishText(text);
        const chars = text.replace(/\s/g, '');

        if (words.length === 0) {
            throw new Error('No text content found on the page.');
        }

        const filteredWords = WebPageAnalyzer.removeStopwords(words, language);
        const sentimentScore = WebPageAnalyzer.calculateSentiment(filteredWords, language);

        const uniqueKeywords = Array.from(new Set(filteredWords)).map(word => ({
            word,
            sentiment: WebPageAnalyzer.calculateSentiment([word], language)
        }));

        return {
            wordCount: words.length,
            charCount: chars.length,
            paragraphCount: $('p').length,
            headingsCount: $('h1, h2, h3, h4, h5, h6').length,
            averageWordLength: chars.length / words.length,
            sentiment: {
                score: sentimentScore,
                comparative: sentimentScore / filteredWords.length,
                keywords: uniqueKeywords
            },
            language: rawLanguage,
        };
    }
}
