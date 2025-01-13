import 'dotenv/config'
import { getApiKey } from '../../utils/getApiKey'
import { askUser } from '../../calling_tools/askUser'
import { createFireCrawlTool } from '../../calling_tools/firecrawl'
import { createVectorStoreTools } from '../../calling_tools/vector'
import { saveReport } from '../../calling_tools/saveReport'
import { agent } from '../../multilang_F/agent'
import { logger } from '../../multilang_F/telemetry'
import { workflow } from '../../multilang_F/workflow'


async function initialize(initialUrl?: string) {
  const apiKey: string = await getApiKey('Firecrawl.dev API KEY', 'FIRECRAWL_API_KEY')
  const { saveDocumentInVectorStore, searchInVectorStore } = createVectorStoreTools()
  const { firecrawl } = createFireCrawlTool({ apiKey })

  const urlCollector = agent({
    description: initialUrl 
      ? `You will use the provided URL: ${initialUrl} for analysis.`
      : `You are responsible for collecting the URL from the user.
         Make sure to validate that the URL looks like a proper web address.`,
    tools: {
      askUser
    }
  })

  const websiteAnalyzer = agent({
    description: `
      You analyze the structure, content, and metadata of websites.
      You can store scraped data in the Vector store for future use.
    `,
    tools: {
      firecrawl,
      saveDocumentInVectorStore,
    },
  })

  const humanAgent = agent({
    description: `
      You interact with the user to ask clarifying questions.
      You can use answers to refine tasks for other agents.
    `,
    tools: {
      askUser
    },
  })

  const reportCompiler = agent({
    description: `
      Create a comprehensive report based on stored website data.
      Generate clean, well-structured Markdown documents.
      Save the final report to a file in the reports directory.
    `,
    tools: {
      searchInVectorStore,
      saveReport, 
    },
  })

  return workflow({
    team: { urlCollector, websiteAnalyzer, humanAgent, reportCompiler },
    description: `
      Analyze a website and create a structured report.
      ${initialUrl ? `Use the provided URL: ${initialUrl} for analysis.` : 'First, ask the user for the website URL to analyze.'}
      - Validate and process the provided URL.
      - Crawl the provided website URL.
      - Save the scraped content in the Vector store.
      - Ask the user for additional questions.
      - Generate a Markdown report summarizing the website.
      - Save the report to a file.
    `,
    knowledge: `
      Use the Vector store to search and summarize crawled data.
      User-provided answers refine the report focus.
      Reports are saved in the 'data/reports' directory with a timestamp.
      The URL should be a valid web address starting with http:// or https://.
      ${initialUrl ? `Initial URL for analysis: ${initialUrl}` : ''}
    `,
    output: `
      A detailed Markdown report summarizing the structure, content, and metadata of the provided website.
      The report will be saved to a file in the data/reports directory.
    `,
    snapshot: logger,
  })
}

export const initializeWorkflow = initialize