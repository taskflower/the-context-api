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
      
      data.items.forEach((link: any) => {
        markdown += `- [${link.text || 'No text'}](${link.url})` +
          `${link.isExternal ? ' (external)' : ''}` +
          `${link.hasImage ? ' (contains image)' : ''}\n`;
      });
    } else if (data.wordCount !== undefined) {
      // For metrics endpoint response
      markdown = `# Page Metrics\n\n` +
        `- Word Count: ${data.wordCount}\n` +
        `- Character Count: ${data.charCount}\n` +
        `- Paragraph Count: ${data.paragraphCount}\n` +
        `- Headings Count: ${data.headingsCount}\n` +
        `- Average Word Length: ${data.averageWordLength.toFixed(2)}\n` +
        `- Language: ${data.language}\n\n` +
        `## Sentiment Analysis\n\n` +
        `- Overall Score: ${data.sentiment.score.toFixed(2)}\n` +
        `- Comparative Score: ${data.sentiment.comparative.toFixed(3)}\n\n` +
        `### Key Words Sentiment\n\n`;
      
      data.sentiment.keywords.forEach((keyword: any) => {
        markdown += `- ${keyword.word}: ${keyword.sentiment.toFixed(2)}\n`;
      });
    }

    return markdown.trim();
  }
}