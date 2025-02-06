// textProcessor.ts
import natural from 'natural';

export class TextProcessor {
    private static tokenizer = new natural.WordTokenizer();
    private static nounInflector = new natural.NounInflector();

    static cleanText(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^a-ząęćłńóśźż ]+/g, '')
            .trim();
    }

    static tokenize(text: string): string[] {
        const cleanedText = this.cleanText(text);
        return cleanedText
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    static removeStopwords(words: string[], stopwords: string[]): string[] {
        return words.filter(word => !stopwords.includes(word));
    }

    static async extractNouns(text: string, stopwords: string[]): Promise<string[]> {
        const cleanedText = this.cleanText(text);
        const basicTokens = this.tokenize(cleanedText);
        const withoutStopwords = this.removeStopwords(basicTokens, stopwords);

        return this.extractEnglishNouns(withoutStopwords.join(' '));
    }

    private static extractEnglishNouns(text: string): string[] {
        const language = "EN";
        const defaultCategory = 'N';
        const defaultCategoryCapital = 'NNP';
        
        const lexicon = new natural.Lexicon(language, defaultCategory, defaultCategoryCapital);
        const rules = new natural.RuleSet('EN');
        const tagger = new natural.BrillPOSTagger(lexicon, rules);

        const tokens = this.tokenizer.tokenize(text);
        const taggedWords = tagger.tag(tokens).taggedWords;
        const nouns: string[] = [];

        for (const taggedWord of taggedWords) {
            if (taggedWord.tag.startsWith('NN')) {
                const lemma = this.nounInflector.singularize(taggedWord.token);
                nouns.push(lemma);
            }
        }

        return Array.from(new Set(nouns));
    }
}