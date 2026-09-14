import mongoose from 'mongoose'
import { Router } from 'express'
import { AnalyticsEvent } from '../models/AnalyticsEvent.js'
import { AuthSession } from '../models/AuthSession.js'
import { CommunityLetter } from '../models/CommunityLetter.js'
import { CommunityMemory } from '../models/CommunityMemory.js'
import { CommunityMemoryFeature } from '../models/CommunityMemoryFeature.js'
import { Feedback } from '../models/Feedback.js'
import { LoginEvent } from '../models/LoginEvent.js'
import { Session } from '../models/Session.js'
import { User } from '../models/User.js'
import { Visitor } from '../models/Visitor.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { getAuthenticatedUser } from './auth.js'

const router = Router()
const readLimit = rateLimit({ scope: 'developer-read', limit: 90, windowMs: 60 * 1000 })

async function requireDeveloper(req, res, next) {
  const user = await getAuthenticatedUser(req)
  if (!user) return res.status(401).json({ error: 'Bạn cần đăng nhập.' })
  if (!['admin', 'developer'].includes(user.role)) return res.status(403).json({ error: 'Chỉ developer mới được truy cập.' })
  req.user = user
  next()
}

router.use(readLimit, requireDeveloper)

const collections = [
  ['users', User],
  ['authSessions', AuthSession],
  ['visitors', Visitor],
  ['analyticsSessions', Session],
  ['analyticsEvents', AnalyticsEvent],
  ['communityLetters', CommunityLetter],
  ['communityMemories', CommunityMemory],
  ['dailyImages', CommunityMemoryFeature],
  ['feedbacks', Feedback],
  ['loginEvents', LoginEvent],
]

router.get('/overview', async (req, res) => {
  const startedAt = Date.now()
  await mongoose.connection.db.admin().ping()
  const counts = await Promise.all(collections.map(async ([name, model]) => ({
    name,
    count: await model.countDocuments(),
  })))

  res.set('Cache-Control', 'no-store')
  res.json({
    system: {
      api: 'online',
      database: mongoose.connection.readyState === 1 ? 'online' : 'offline',
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.round(process.uptime()),
      responseTimeMs: Date.now() - startedAt,
      nodeVersion: process.version,
    },
    connections: [
      { key: 'mongodb', label: 'MongoDB', connected: mongoose.connection.readyState === 1, configuration: 'MONGO_URI' },
      { key: 'google', label: 'Google Login', connected: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), configuration: 'GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET' },
      { key: 'facebook', label: 'Facebook Login', connected: Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET), configuration: 'FACEBOOK_APP_ID + FACEBOOK_APP_SECRET' },
      { key: 'email', label: 'Resend Email', connected: Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM), configuration: 'RESEND_API_KEY + AUTH_EMAIL_FROM' },
    ],
    collections: counts,
  })
})

router.get('/logs', async (req, res) => {
  const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 40))
  const [logins, events] = await Promise.all([
    LoginEvent.find().sort({ createdAt: -1 }).limit(limit).populate('userId', 'name email role').lean(),
    AnalyticsEvent.find().select('type room userId createdAt').sort({ createdAt: -1 }).limit(limit).lean(),
  ])
  const items = [
    ...logins.map((item) => ({
      id: String(item._id), level: 'info', source: 'auth', event: 'login_success',
      detail: `${item.userId?.email || 'unknown'} · ${item.provider}`, createdAt: item.createdAt,
    })),
    ...events.map((item) => ({
      id: String(item._id), level: 'info', source: 'analytics', event: item.type,
      detail: item.room || 'home', createdAt: item.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit)

  res.set('Cache-Control', 'no-store')
  res.json({ items })
})

router.post('/probe', async (req, res) => {
  const target = String(req.body?.target || '')
  const startedAt = Date.now()
  if (!['api', 'database', 'auth', 'memories'].includes(target)) return res.status(400).json({ error: 'Target chưa hợp lệ.' })
  if (target === 'database') await mongoose.connection.db.admin().ping()
  if (target === 'auth' && !req.user) return res.status(401).json({ error: 'Auth unavailable' })
  if (target === 'memories') await CommunityMemory.exists({})
  res.json({ target, ok: true, status: 200, durationMs: Date.now() - startedAt, checkedAt: new Date() })
})

export default router
