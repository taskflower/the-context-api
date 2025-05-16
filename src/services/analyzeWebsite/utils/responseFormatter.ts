// src/services/analyzeWebsite/utils/responseFormatter.ts
import { Response } from 'express';
import TurndownService from 'turndown';

export class ResponseFormatter {
  private static turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-'
  });

  static formatResponse(res: Response, data: any) {
    const markdown = this.convertToMarkdown(data);
    res.json({
      success: true,
      data: {
        message: {
          role: "assistant",
          content: markdown
        },
        tokenUsage: {
          cost: res.locals.tokenCost || 0,
          remaining: res.locals.remainingTokens || 8000
        }
      }
    });
  }

  private static convertToMarkdown(data: any): string {
    if (typeof data === 'string') {
      return data;
    }

    let markdown = '';

    // Handle different types of responses
    if (data.markdown) {
      // For markdown endpoint response
      markdown = `# Converted Content\n\n${data.markdown}\n\n`;
      if (data.images && data.images.length > 0) {
        markdown += '## Images\n\n';
        data.images.forEach((img: { altText: string }) => {
          markdown += `- ${img.altText}\n`;
        });
      }
    } else if (data.total !== undefined) {
      // For links endpoint response
      markdown = `# Link Analysis\n\n` +
        `- Total Links: ${data.total}\n` +
        `- External Links: ${data.external}\n` +
        `- Internal Links: ${data.internal}\n` +
        `- Links with Images: ${data.withImages}\n\n` +
        `## Detailed Links\n\n`;
      
      if (data.items && data.items.length > 0) {
        data.items.forEach((link: any) => {
          markdown += `- [${link.text || 'No text'}](${link.url})` +
            `${link.isExternal ? ' (external)' : ''}` +
            `${link.hasImage ? ' (contains image)' : ''}\n`;
        });
      } else {
        markdown += "No links found on this page.\n";
      }
    } else if (data.wordCount !== undefined) {
      // For metrics endpoint response
      markdown = `# Page Metrics\n\n` +
        `## Text Statistics\n\n` +
        `- Words: ${data.wordCount}\n` +
        `- Characters: ${data.charCount}\n` +
        `- Paragraphs: ${data.paragraphCount}\n` +
        `- Headings: ${data.headingsCount}\n` +
        `- Average Word Length: ${data.averageWordLength}\n` +
        `- Language: ${data.language}\n\n` +
        `## Sentiment Analysis\n\n` +
        `- Score: ${data.sentiment.score}\n` +
        `- Comparative: ${data.sentiment.comparative}\n\n`;
      
      if (data.sentiment.keywords && data.sentiment.keywords.length > 0) {
        markdown += `### Sentiment Keywords\n\n`;
        data.sentiment.keywords.forEach((keyword: { word: string; sentiment: number }) => {
          markdown += `- ${keyword.word}: ${keyword.sentiment > 0 ? '😊' : '😟'} (${keyword.sentiment})\n`;
        });
      }
    } else {
      // Default case for unknown response formats
      markdown = `# Analysis Results\n\n` + 
        JSON.stringify(data, null, 2)
          .replace(/```/g, '\\`\\`\\`'); // Escape code blocks
    }

    return markdown.trim();
  }
}