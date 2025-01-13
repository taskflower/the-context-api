// src/services/webVector/webVector.ts
import 'dotenv/config'
import { createServiceRunner } from '../serviceFactory'
import { initializeWorkflow as initialize } from './webVector.config'

export const run = createServiceRunner({ initialize })

if (require.main === module) {
  run('https://example.com').catch((error) => {
    console.error('An error occurred:', error)
    process.exit(1)
  })
}