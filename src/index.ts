// src/index.ts
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import serviceRoutes from './routes/services.routes'
import authRoutes from './routes/auth.routes'

const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/v1/services', serviceRoutes)  // Wszystkie endpointy serwisów pod /services
app.use('/api/v1/auth', authRoutes)         // Endpointy autoryzacji pod /auth

// Basic error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    status: 'error',
    message: 'Coś poszło nie tak!'
  })
})

// 404 handling
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Nie znaleziono endpointu'
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`)
})

export default app