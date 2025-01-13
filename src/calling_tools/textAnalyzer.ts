// src/tools/textAnalyzer.ts
import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

export const textAnalyzer = tool({
  description: 'Analyze text content for marketing and content insights',
  parameters: z.object({
    content: z.string().describe('Text content to analyze'),
  }),
  execute: async ({ content }: { content: string }): Promise<string> => {
    try {
      const analysis = {
        content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
        wordCount: content.split(/\s+/).length,
        paragraphCount: content.split('\n\n').length,
        timestamp: new Date().toISOString(),
        // Add more analysis metrics here
      };
      
      return JSON.stringify(analysis, null, 2);
    } catch (error) {
      return `Error analyzing text: ${(error as Error).message}`;
    }
  },
});