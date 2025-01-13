import { tool } from 'fabrice-ai/tool'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

export const saveReport = tool({
  description: 'Save a Markdown report to a file in data/reports directory',
  parameters: z.object({
    filename: z.string().describe('Name of the file to save (without .md extension)'),
    content: z.string().describe('Markdown content to save'),
    metadata: z.string().optional().describe('Optional metadata to include in the report header')
  }),
  execute: async ({ filename, content, metadata = '' }): Promise<string> => {
    console.log('Attempting to save report:', { filename, metadata });
    try {
      // Przesuń się do katalogu głównego projektu (zakładając że jesteśmy w src)
      const projectRoot = path.join(process.cwd(), '..')
      
      // Stwórz ścieżkę do data/reports
      const reportsDir = path.join(projectRoot, 'data', 'reports')
      
      // Upewnij się że istnieje cała struktura katalogów
      await fs.mkdir(reportsDir, { recursive: true })

      // Dodaj metadane jako YAML front matter jeśli są
      const reportContent = metadata 
        ? `---\n${metadata}\n---\n\n${content}`
        : content

      // Zapisz plik z timestampem
      const timestamp = new Date().toISOString().split('T')[0]
      const fullFilename = `${filename}-${timestamp}.md`
      const filePath = path.join(reportsDir, fullFilename)
      
      await fs.writeFile(filePath, reportContent, 'utf-8')
      
      return `Report saved successfully to: ${filePath}`
    } catch (error) {
      return `Error saving report: ${(error as Error).message}`
    }
  }
})