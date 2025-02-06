import { DictionarySet } from "./webAnalyzer";

// sentimentAnalyzer.ts
export interface SentimentResult {
    score: number;
    details: Array<{ word: string; score: number }>;
}

export class SentimentAnalyzer {
    constructor(private dictionaries: Record<string, DictionarySet>) {}

    analyze(words: string[], language: string): SentimentResult {
        const dict = this.dictionaries[language] || this.dictionaries['en'];
        const details: Array<{ word: string; score: number }> = [];
        
        const rawScore = words.reduce((score, word) => {
            const positiveScore = dict.positive[word];
            const negativeScore = dict.negative[word];
            
            if (positiveScore || negativeScore) {
                const wordScore = positiveScore || negativeScore;
                details.push({ word, score: wordScore });
                return score + wordScore;
            }
            return score;
        }, 0);
    
        // Normalizacja wyniku do zakresu -100% do 100%
        const maxPossibleScore = 2.0; // Największa waga w słownikach
        const normalizedScore = (rawScore / (words.length * maxPossibleScore)) * 100;
    
        return { 
            score: normalizedScore,
            details 
        };
    }
}