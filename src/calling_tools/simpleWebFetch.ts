// src/tools/simpleWebFetch.ts
import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'
import fetch from 'node-fetch'

export const simpleWebFetch = tool({
  description: 'Fetch text content from website',
  parameters: z.object({
    url: z.string().describe('URL of the website to fetch'),
  }),
  execute: async ({ url }): Promise<string> => {
    const response = await fetch(url);
    const text = await response.text();
    return text.replace(/\s+/g, ' ').trim();
  },
});