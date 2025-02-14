// src/services/analyzeWebsite/websiteAnalysis.service.ts
import path from 'path';
import { WebPageAnalyzer } from './utils/webAnalyzer';

export class WebsiteAnalysisService {
  private analyzer: WebPageAnalyzer | null = null;

  private async initializeAnalyzer() {
    if (!this.analyzer) {
      this.analyzer = await WebPageAnalyzer.create(
        path.join(__dirname, '../../../dictionaries')
      );
    }
    return this.analyzer;
  }

  async getMarkdown(url: string) {
    const analyzer = await this.initializeAnalyzer();
    return analyzer.htmlToMarkdown(url);
  }

  async getLinks(url: string) {
    const analyzer = await this.initializeAnalyzer();
    const links = await analyzer.collectLinks(url);
    return {
      total: links.length,
      external: links.filter(link => link.isExternal).length,
      internal: links.filter(link => !link.isExternal).length,
      withImages: links.filter(link => link.hasImage).length,
      items: links,
    };
  }

  async getMetrics(url: string) {
    const analyzer = await this.initializeAnalyzer();
    return analyzer.analyzeTextMetrics(url);
  }
}
