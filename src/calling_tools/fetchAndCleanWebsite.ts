// src/tools/fetchAndCleanWebsite.ts
import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const fetchAndCleanWebsite = tool({
  description: 'Fetch and clean website content by removing unnecessary elements',
  parameters: z.object({
    url: z.string().describe('URL of the website to fetch and clean'),
  }),
  execute: async ({ url }: { url: string }): Promise<string> => {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove non-content elements
      $("script, style, link, meta, noscript, iframe, frame, object, embed, audio, video, canvas, svg, header, footer, nav, aside, menu, form, [aria-hidden='true'], [hidden]").remove();

      const meaningfulSelectors = ["p", "h1", "h2", "h3", "h4", "li", "td", "th", "figcaption"];
      const meaningfulText = meaningfulSelectors
        .flatMap((selector) => $(selector).map((_, el) => $(el).text().trim()).get())
        .filter(Boolean);

      return meaningfulText.join("\n").replace(/\s+/g, " ").trim();
    } catch (error) {
      return `Error fetching website: ${(error as Error).message}`;
    }
  },
});