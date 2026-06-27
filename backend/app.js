import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDatabase } from './db.js'
import analyticsRouter from './routes/analytics.js'
import authRouter from './routes/auth.js'
import communityLettersRouter from './routes/communityLetters.js'
import feedbackRouter from './routes/feedback.js'
import tlRegistrationsRouter from './routes/tlRegistrations.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function ensureDatabase(req, res, next) {
  try {
    await connectDatabase()
    next()
  } catch (error) {
    console.error('Database connection failed:', error)
    res.status(503).json({
      error: 'Database unavailable',
      detail: process.env.NODE_ENV === 'production' ? undefined : error.message,
    })
  }
}

export function createApp({ serveStatic = false } = {}) {
  const app = express()

  app.set('trust proxy', 1)
  app.disable('x-powered-by')
  app.use(express.json({ limit: '2mb' }))

  app.get(['/api/health', '/health'], (req, res) => {
    res.json({ ok: true })
  })

  app.use(['/api/analytics', '/analytics'], ensureDatabase, analyticsRouter)
  app.use('/api/auth', ensureDatabase, authRouter)
  app.use('/api/community-letters', ensureDatabase, communityLettersRouter)
  app.use('/api/feedback', ensureDatabase, feedbackRouter)
  app.use('/api/tl-registrations', ensureDatabase, tlRegistrationsRouter)

  if (serveStatic) {
    const distPath = path.resolve(__dirname, '../dist')
    app.use(express.static(distPath))
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        next()
        return
      }

      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error)
      return
    }

    console.error('Unhandled backend error:', error)
    const status = error.status || 500
    const message = status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message || 'Internal server error'

    res.status(status).json({
      error: message,
    })
  })

  return app
}

export default createApp()
