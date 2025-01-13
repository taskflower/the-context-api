// src/services/simpleAnalyzer/simpleAnalyzer.ts
import { createServiceRunner } from '../serviceFactory'
import { initialize } from './simpleAnalyzer.config'

export const run = createServiceRunner({ initialize })

if (require.main === module) {
  run('https://obiado.pl').catch((error) => {
    console.error('An error occurred:', error)
    process.exit(1)
  })
}