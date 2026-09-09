import express from 'express'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDatabase } from './db.js'
import analyticsRouter from './routes/analytics.js'
import authRouter from './routes/auth.js'
import communityLettersRouter from './routes/communityLetters.js'
import feedbackRouter from './routes/feedback.js'
import communityMemoriesRouter from './routes/communityMemories.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

function getRequestOrigin(req) {
  const protocol = req.protocol || (req.get('x-forwarded-proto') === 'https' ? 'https' : 'http')
  return `${protocol}://${req.get('host')}`
}

function getAllowedOrigins(req) {
  const origins = new Set([getRequestOrigin(req)])
  const configuredOrigins = String(process.env.APP_ORIGIN || process.env.AUTH_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    configuredOrigins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  }
  if (process.env.VERCEL_URL) configuredOrigins.push(`https://${process.env.VERCEL_URL}`)

  configuredOrigins.forEach((origin) => {
    try {
      origins.add(new URL(origin).origin)
    } catch {
      // Invalid configured origins are ignored instead of weakening the check.
    }
  })

  return origins
}

function enforceRequestOrigin(req, res, next) {
  if (safeMethods.has(req.method)) {
    next()
    return
  }

  res.vary('Origin')
  res.vary('Sec-Fetch-Site')

  const fetchSite = String(req.get('sec-fetch-site') || '').toLowerCase()
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') {
    res.status(403).json({ error: 'Yêu cầu khác nguồn đã bị chặn.' })
    return
  }

  const sourceOrigin = req.get('origin')
  if (!sourceOrigin) {
    // Non-browser clients do not send Origin or Fetch Metadata headers.
    if (!fetchSite) {
      next()
      return
    }

    res.status(403).json({ error: 'Không xác minh được nguồn gửi yêu cầu.' })
    return
  }

  try {
    if (getAllowedOrigins(req).has(new URL(sourceOrigin).origin)) {
      next()
      return
    }
  } catch {
    // Invalid Origin values are rejected below.
  }

  res.status(403).json({ error: 'Yêu cầu khác nguồn đã bị chặn.' })
}

function getHelmetOptions() {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        frameSrc: ['https://open.spotify.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        mediaSrc: ["'self'", 'blob:', 'https://cdn.hstatic.net'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        workerSrc: ["'self'", 'blob:'],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    hsts: isProduction
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }
}

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
  app.use(helmet(getHelmetOptions()))
  app.use(express.json({ limit: '2mb' }))
  app.use(enforceRequestOrigin)
  app.use('/api/auth', (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  app.get(['/api/health', '/health'], (req, res) => {
    res.json({ ok: true })
  })

  app.use(['/api/analytics', '/analytics'], ensureDatabase, analyticsRouter)
  app.use('/api/auth', ensureDatabase, authRouter)
  app.use('/api/community-letters', ensureDatabase, communityLettersRouter)
  app.use('/api/community-memories', ensureDatabase, communityMemoriesRouter)
  app.use('/api/feedback', ensureDatabase, feedbackRouter)

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
