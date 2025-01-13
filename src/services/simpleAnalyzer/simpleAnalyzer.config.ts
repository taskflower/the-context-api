// src/services/simpleAnalyzer/simpleAnalyzer.config.ts
import { agent } from '../../multilang_F/agent'
import { workflow } from '../../multilang_F/workflow'
import { logger } from '../../multilang_F/telemetry'
import { simpleWebFetch } from '../../calling_tools/simpleWebFetch'

export async function initialize(initialUrl?: string) {
  const websiteAnalyzer = agent({
    description: `
      You analyze text content from websites and provide concise, informative summaries.
      Focus on the main purpose of the website and key features or offerings.
      ${initialUrl ? `Analyze the provided URL: ${initialUrl}` : 'Wait for URL input to analyze.'}
    `,
    tools: { 
      simpleWebFetch 
    }
  });

  return workflow({
    team: { websiteAnalyzer },
    description: `
      Analyze website content and provide a summary.
      ${initialUrl ? `Use the provided URL: ${initialUrl} for analysis.` : 'Wait for URL to be provided.'}
      - Fetch and analyze the website content
      - Generate a concise summary
    `,
    knowledge: `
      Focus on extracting key information and purpose.
      The URL should be a valid web address starting with http:// or https://.
      ${initialUrl ? `Initial URL for analysis: ${initialUrl}` : ''}
    `,
    output: `A concise summary of the website's content and purpose.`,
    snapshot: logger,
  });
}