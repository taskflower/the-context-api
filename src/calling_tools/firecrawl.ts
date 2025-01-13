import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

interface FireCrawlOptions {
  apiKey: string
  formats?: string[]
  url?: string
}

const FireCrawlResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    markdown: z.string().optional(),
    html: z.string().optional(),
    metadata: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      language: z.string().optional(),
      keywords: z.string().optional(),
      robots: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogUrl: z.string().optional(),
      ogImage: z.string().optional(),
      sourceURL: z.string().optional(),
      statusCode: z.number().optional(),
    }),
  }),
})

const defaults = {
  formats: ['markdown'],
  url: 'https://api.firecrawl.dev/v1/scrape',
}

export const createFireCrawlTool = (options: FireCrawlOptions) => {
  const config = {
    ...defaults,
    ...options,
  }

  return {
    firecrawl: tool({
      description:
        'Scrape a website and return its content in specified formats using the FireCrawl API',
      parameters: z.object({
        url: z.string().describe('URL of the website to scrape'),
        formats: z
          .array(z.string())
          .describe('Output formats to include (options: markdown, html). Default: markdown'),
      }),
      execute: async ({
        url,
        formats,
      }: {
        url: string
        formats?: string[]
      }): Promise<string> => {
        const body = {
          url,
          formats: formats || config.formats,
        }

        try {
          const response = await fetch(config.url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          })

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }

          const responseData = await response.json()
          const parsedResponse = FireCrawlResponseSchema.parse(responseData)

          if (!parsedResponse.success) {
            throw new Error('Failed to scrape the website.')
          }

          // Konwertujemy odpowiedź na string zamiast zwracać surowy obiekt
          return JSON.stringify(parsedResponse.data)
        } catch (error) {
          return `Error scraping website: ${(error as Error).message}`
        }
      },
    }),
  }
}