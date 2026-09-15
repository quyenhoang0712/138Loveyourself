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
import { VisualConfig } from '../models/VisualConfig.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { getAuthenticatedUser } from './auth.js'

const router = Router()
const readLimit = rateLimit({ scope: 'developer-read', limit: 90, windowMs: 60 * 1000 })
const visualWriteLimit = rateLimit({ scope: 'developer-visual-write', limit: 120, windowMs: 60 * 1000 })
const visualDefaults = {
  content: {
    title: 'Phòng thông điệp',
    subtitle: 'Bạn hãy nhắm mắt lại và lắng nghe con tim mình mách bảo nha.',
  },
  desktop: { heading: { x: 0, y: 0 }, subtitle: { x: 0, y: 0 }, letters: { x: 0, y: 0, scale: 1 }, decoration: { x: 0, y: 0 }, mascot: { x: 0, y: 0, width: 0 } },
  tablet: { heading: { x: 0, y: 0 }, subtitle: { x: 0, y: 0 }, letters: { x: 0, y: 0, scale: 1 }, decoration: { x: 0, y: 0 }, mascot: { x: 0, y: 0, width: 0 } },
  mobile: { heading: { x: 0, y: 0 }, subtitle: { x: 0, y: 0 }, letters: { x: 0, y: 0, scale: 1 }, decoration: { x: 0, y: 0 }, mascot: { x: 0, y: 0, width: 0 } },
}

function mergeVisualConfig(config = {}) {
  return {
    content: { ...visualDefaults.content, ...(config.content || {}) },
    ...Object.fromEntries(['desktop', 'tablet', 'mobile'].map((breakpoint) => [breakpoint, {
      ...visualDefaults[breakpoint],
      ...Object.fromEntries(Object.keys(visualDefaults[breakpoint]).map((element) => [element, {
        ...visualDefaults[breakpoint][element], ...(config[breakpoint]?.[element] || {}),
      }])),
    }])),
  }
}

function sanitizeVisualConfig(input) {
  const output = mergeVisualConfig(input)
  output.content.title = String(output.content.title || '').trim().slice(0, 80) || visualDefaults.content.title
  output.content.subtitle = String(output.content.subtitle || '').trim().slice(0, 240) || visualDefaults.content.subtitle
  for (const breakpoint of ['desktop', 'tablet', 'mobile']) {
    for (const [element, defaults] of Object.entries(visualDefaults[breakpoint])) {
      for (const key of Object.keys(defaults)) {
        const value = Number(output[breakpoint][element][key])
        if (!Number.isFinite(value)) output[breakpoint][element][key] = defaults[key]
        else if (key === 'scale') output[breakpoint][element][key] = Math.min(1.5, Math.max(.5, value))
        else if (key === 'width') output[breakpoint][element][key] = Math.min(600, Math.max(0, Math.round(value)))
        else output[breakpoint][element][key] = Math.min(500, Math.max(-500, Math.round(value)))
      }
    }
  }
  return output
}

router.get('/visual/card-room/published', async (req, res) => {
  const config = await VisualConfig.findOne({ page: 'card-room' }).select('published updatedAt').lean()
  res.set('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=60')
  res.json({ config: mergeVisualConfig(config?.published), updatedAt: config?.updatedAt || null })
})

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
  ['visualConfigs', VisualConfig],
]

router.get('/visual/card-room', async (req, res) => {
  const config = await VisualConfig.findOne({ page: 'card-room' }).lean()
  res.set('Cache-Control', 'no-store')
  res.json({
    draft: mergeVisualConfig(config?.draft || config?.published),
    published: mergeVisualConfig(config?.published),
    revisions: (config?.revisions || []).slice(-10).reverse().map((revision) => ({
      publishedAt: revision.publishedAt, publishedBy: revision.publishedBy,
    })),
  })
})

router.put('/visual/card-room/draft', visualWriteLimit, async (req, res) => {
  const draft = sanitizeVisualConfig(req.body?.config)
  await VisualConfig.findOneAndUpdate(
    { page: 'card-room' },
    { $set: { draft, updatedBy: req.user._id } },
    { upsert: true, returnDocument: 'after', runValidators: true },
  )
  res.json({ draft })
})

router.post('/visual/card-room/publish', visualWriteLimit, async (req, res) => {
  const existing = await VisualConfig.findOne({ page: 'card-room' }).lean()
  const published = sanitizeVisualConfig(existing?.draft || existing?.published)
  const revisions = [...(existing?.revisions || []), { config: published, publishedBy: req.user._id, publishedAt: new Date() }].slice(-20)
  await VisualConfig.findOneAndUpdate(
    { page: 'card-room' },
    { $set: { draft: published, published, revisions, updatedBy: req.user._id } },
    { upsert: true, returnDocument: 'after', runValidators: true },
  )
  res.json({ published })
})

router.post('/visual/card-room/reset', visualWriteLimit, async (req, res) => {
  const existing = await VisualConfig.findOne({ page: 'card-room' }).select('published').lean()
  const draft = mergeVisualConfig(existing?.published)
  await VisualConfig.findOneAndUpdate(
    { page: 'card-room' }, { $set: { draft, updatedBy: req.user._id } },
    { upsert: true, returnDocument: 'after', runValidators: true },
  )
  res.json({ draft })
})

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
