// src/routes/auth.routes.ts
import { Router } from 'express'
import { AuthRequest, verifyToken } from '../middleware/auth.middleware'

const router = Router()

router.get('/protected', verifyToken, (req: AuthRequest, res) => {
  res.json({ 
    message: 'Dostęp przyznany',
    user: req.user 
  })
})

router.get('/status', verifyToken, (req: AuthRequest, res) => {
  res.json({
    authenticated: true,
    user: req.user
  })
})

export default router