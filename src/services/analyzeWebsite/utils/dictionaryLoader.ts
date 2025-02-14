// dictionaryLoader.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { DictionarySet, SentimentDictionary } from './webAnalyzer';

export interface CompleteWordDictionary {
    sentiment: DictionarySet;
    stopwords: string[];
}

export class DictionaryLoader {
    static async loadDictionaries(basePath: string): Promise<Record<string, CompleteWordDictionary> | null> {
        try {
            const languages = ['pl', 'en'];
            const dictionaries: Record<string, CompleteWordDictionary> = {};

            for (const lang of languages) {
                const positive = await this.loadFile(basePath, `positive_${lang}.txt`);
                const negative = await this.loadFile(basePath, `negative_${lang}.txt`);
                const stopwords = await this.loadFile(basePath, `stopwords_${lang}.txt`);
                
                dictionaries[lang] = {
                    sentiment: {
                        positive: this.parseSentimentDictionary(positive),
                        negative: this.parseSentimentDictionary(negative)
                    },
                    stopwords: this.parseStopwords(stopwords)
                };
            }

            return dictionaries;
        } catch (error) {
            console.warn('Nie znaleziono słowników:', error);
            return null;
        }
    }

    private static async loadFile(basePath: string, filename: string): Promise<string> {
        return fs.readFile(path.join(basePath, filename), 'utf8');
    }

    private static parseSentimentDictionary(content: string): SentimentDictionary {
        return content
            .split('\n')
            .reduce((dict: SentimentDictionary, line) => {
                const [word, score] = line.trim().split(' ');
                if (word && score) {
                    dict[word] = parseFloat(score);
                }
                return dict;
            }, {});
    }

    private static parseStopwords(content: string): string[] {
        return content
            .split('\n')
            .map(line => line.trim())
            .filter(word => word.length > 0);
    }
}
