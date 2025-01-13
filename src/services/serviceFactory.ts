// src/services/serviceFactory.ts
import { solution } from '../multilang_F/solution'
import { teamwork } from '../multilang_F/teamwork'
import { RequestHandler, Router } from 'express'

interface ServiceConfig {
  initialize: (params?: any) => Promise<any>
}

// Funkcja pomocnicza do walidacji URL
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString)
    return true
  } catch {
    return false
  }
}

const extractUrlFromParams = (params: any): string => {
  if (typeof params === 'string') return params
  if (params && typeof params === 'object' && 'url' in params) {
    return params.url
  }
  throw new Error('Nie znaleziono prawidłowego URL w parametrach')
}

export function createServiceRunner(
  serviceConfig: ServiceConfig,
  legacyUrlOnly: boolean = true
) {
  return async function run(params: any) {
    if (legacyUrlOnly) {
      const url = extractUrlFromParams(params)
      if (!isValidUrl(url)) {
        throw new Error('Nieprawidłowy format URL. URL musi zaczynać się od http:// lub https://')
      }
      const workflow = await serviceConfig.initialize(url)
      const result = await teamwork(workflow)
      console.log(solution(result))
      return result
    }

    const workflow = await serviceConfig.initialize(params)
    const result = await teamwork(workflow)
    console.log(solution(result))
    return result
  }
}

export function createServiceRouter(
  serviceName: string,
  runner: (params: any) => Promise<any>,
  options: {
    endpoint?: string,
    legacyUrlOnly?: boolean
  } = {}
): Router {
  const router = Router()
  const { endpoint = '/run', legacyUrlOnly = true } = options

  const handler: RequestHandler = async (req, res) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).json({
          error: 'Brak parametrów',
          message: 'Nie przesłano wymaganych parametrów w body'
        })
        return
      }

      if (legacyUrlOnly) {
        const { url } = req.body
        if (!url || !isValidUrl(url)) {
          res.status(400).json({
            error: 'Nieprawidłowy URL',
            message: 'URL musi zaczynać się od http:// lub https://'
          })
          return
        }
      }

      const result = await runner(req.body)
      res.json({
        success: true,
        message: `${serviceName} zakończone`,
        params: req.body,
        result
      })
    } catch (error) {
      console.error(`${serviceName} error:`, error)
      
      if (error instanceof Error) {
        if (error.message.includes('Nieprawidłowy format URL') || 
            error.message.includes('nie znaleziono prawidłowego URL')) {
          res.status(400).json({
            error: 'Nieprawidłowy URL',
            message: error.message
          })
          return
        }
        
        if (error.message.includes('Failed to fetch')) {
          res.status(502).json({
            error: 'Strona niedostępna',
            message: 'Nie można uzyskać dostępu do strony. Sprawdź czy URL jest poprawny i strona działa.'
          })
          return
        }
      }
      
      res.status(500).json({
        error: `Błąd serwisu ${serviceName}`,
        message: error instanceof Error ? error.message : 'Nieznany błąd'
      })
    }
  }

  router.post(endpoint, handler)
  return router
}