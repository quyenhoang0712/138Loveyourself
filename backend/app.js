import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDatabase } from './db.js'
import analyticsRouter from './routes/analytics.js'
import authRouter from './routes/auth.js'
import feedbackRouter from './routes/feedback.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function ensureDatabase(req, res, next) {
  try {
    await connectDatabase()
    next()
  } catch (error) {
    res.status(503).json({
      error: 'Database unavailable',
      detail: error.message,
    })
  }
}

export function createApp({ serveStatic = false } = {}) {
  const app = express()

  app.use(express.json({ limit: '1mb' }))

  app.get(['/api/health', '/health'], (req, res) => {
    res.json({ ok: true })
  })

  app.use(['/api/analytics', '/analytics'], ensureDatabase, analyticsRouter)
  app.use('/api/auth', ensureDatabase, authRouter)
  app.use('/api/feedback', ensureDatabase, feedbackRouter)

  if (serveStatic) {
    const distPath = path.resolve(__dirname, '../dist')
    app.use(express.static(distPath))
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  return app
}

export default createApp()
