import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'

async function requestUserInput(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    console.log('❔' + promptText)
    process.stdin.resume()
    process.stdin.once('data', (data) => {
      process.stdin.pause()
      resolve(data.toString().trim())
    })
  })
}

export const askUser = tool({
  description: 'Tool for asking user a question',
  parameters: z.object({
    query: z.string().describe('The question to ask the user'),
  }),
  execute: async ({ query }: { query: string }): Promise<string> => {
    return requestUserInput(query)
  },
})
