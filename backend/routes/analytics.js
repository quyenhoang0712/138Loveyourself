import crypto from 'crypto'
import { Router } from 'express'
import { AnalyticsEvent } from '../models/AnalyticsEvent.js'
import { Feedback } from '../models/Feedback.js'
import { Session } from '../models/Session.js'
import { User } from '../models/User.js'
import { Visitor } from '../models/Visitor.js'
import { applySessionActivity, getAgeGroup, getDateRange } from '../utils/analytics.js'

const router = Router()

const allowedRooms = new Set(['home', 'card-room', 'focus-room', 'healing-room', 'sound-room', 'play-room', 'community'])
const iceCubeSeconds = 30 * 60
const allowedEvents = new Set([
  'profile_saved',
  'session_start',
  'room_view',
  'letter_open',
  'quote_share',
  'quote_save',
  'decision_ask',
  'ambient_toggle',
  'timer_start',
  'timer_pause',
  'timer_reset',
  'spotify_view',
  'community_letter_read',
  'community_letter_write',
])

function normalizeRoom(room) {
  return allowedRooms.has(room) ? room : 'home'
}

function getCookie(req, name) {
  const cookies = req.get('cookie') || ''

  return cookies.split(';').reduce((value, cookie) => {
    const [cookieName, ...cookieValue] = cookie.trim().split('=')
    return cookieName === name ? decodeURIComponent(cookieValue.join('=')) : value
  }, '')
}

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET || 'development-only-change-me'
}

function sign(value) {
  const signature = crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url')
  return `${value}.${signature}`
}

function verify(signedValue) {
  const separatorIndex = signedValue.lastIndexOf('.')
  if (separatorIndex < 1) return null

  const value = signedValue.slice(0, separatorIndex)
  const signature = signedValue.slice(separatorIndex + 1)
  const expected = sign(value).slice(value.length + 1)

  if (signature.length !== expected.length) return null
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? value : null
}

function readSession(req) {
  try {
    const payload = verify(getCookie(req, 'love_yourself_session'))
    if (!payload) return null

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return session.expiresAt > Date.now() ? session : null
  } catch {
    return null
  }
}

function userProjection() {
  return 'name email role age gender ageGroup'
}

async function requireAdmin(req, res, next) {
  const session = readSession(req)
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const user = await User.findById(session.userId).select('role').lean()
  if (user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' })
    return
  }

  next()
}

async function requireUser(req, res, next) {
  const session = readSession(req)
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const user = await User.findById(session.userId).select(userProjection()).lean()
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  req.user = user
  next()
}

async function getAuthenticatedUser(req) {
  const session = readSession(req)
  return session ? User.findById(session.userId).select(userProjection()).lean() : null
}

function roomDurationEntries(roomDurations) {
  if (!roomDurations) return []
  if (roomDurations instanceof Map) return Array.from(roomDurations.entries())
  return Object.entries(roomDurations)
}

function applySessionStats(sessions) {
  const durationByRoom = {}
  const lastRoomCounts = {}
  let totalDurationSeconds = 0

  sessions.forEach((session) => {
    lastRoomCounts[session.lastRoom] = (lastRoomCounts[session.lastRoom] || 0) + 1
    totalDurationSeconds += session.durationSeconds || 0

    roomDurationEntries(session.roomDurations).forEach(([room, seconds]) => {
      durationByRoom[room] = (durationByRoom[room] || 0) + Number(seconds || 0)
    })
  })

  return {
    totalDurationSeconds,
    roomDurations: Object.entries(durationByRoom)
      .map(([room, seconds]) => ({ room, seconds }))
      .sort((a, b) => b.seconds - a.seconds),
    stoppedRooms: Object.entries(lastRoomCounts)
      .map(([room, count]) => ({ room, count }))
      .sort((a, b) => b.count - a.count),
  }
}

async function recordEvent({ visitorId, sessionId, userId = '', type, room, metadata = {} }) {
  if (!visitorId || !sessionId || !type) return null
  if (!allowedEvents.has(type)) return null

  return AnalyticsEvent.create({
    visitorId,
    sessionId,
    userId,
    type,
    room: normalizeRoom(room),
    metadata,
  })
}

router.post('/identify', async (req, res) => {
  const { visitorId, age, gender, sessionId } = req.body
  const normalizedAge = Number(age)

  if (!visitorId || !Number.isInteger(normalizedAge) || normalizedAge < 1 || normalizedAge > 120) {
    res.status(400).json({ error: 'Invalid visitor profile' })
    return
  }

  if (!['male', 'female', 'other'].includes(gender)) {
    res.status(400).json({ error: 'Invalid gender' })
    return
  }

  const ageGroup = getAgeGroup(normalizedAge)
  const user = await getAuthenticatedUser(req)
  const visitor = await Visitor.findOneAndUpdate(
    { visitorId },
    {
      $set: {
        age: normalizedAge,
        gender,
        ageGroup,
        lastSeenAt: new Date(),
      },
      $setOnInsert: { firstSeenAt: new Date() },
    },
    { returnDocument: 'after', upsert: true },
  ).lean()

  if (user) {
    await User.updateOne(
      { _id: user._id },
      { $set: { age: normalizedAge, gender, ageGroup } },
    )
  }

  if (sessionId) {
    await recordEvent({
      visitorId,
      sessionId,
      userId: user ? String(user._id) : '',
      type: 'profile_saved',
      room: 'home',
      metadata: { gender, ageGroup: visitor.ageGroup },
    })
  }

  res.json({ visitor })
})

router.get('/profile/:visitorId', async (req, res) => {
  const visitor = await Visitor.findOne({ visitorId: req.params.visitorId }).lean()

  if (!visitor) {
    res.status(404).json({ visitor: null })
    return
  }

  res.json({ visitor })
})

router.post('/sessions', async (req, res) => {
  const { visitorId, sessionId, room = 'home', referrer = '' } = req.body
  const user = await getAuthenticatedUser(req)
  const userId = user ? String(user._id) : ''

  if (!visitorId || !sessionId) {
    res.status(400).json({ error: 'Missing visitorId or sessionId' })
    return
  }

  const now = new Date()
  const session = await Session.findOneAndUpdate(
    { sessionId },
    {
      ...(userId ? { $set: { userId } } : {}),
      $setOnInsert: {
        sessionId,
        visitorId,
        startedAt: now,
        lastActiveAt: now,
        lastRoom: normalizeRoom(room),
        userAgent: req.get('user-agent') || '',
        referrer,
      },
    },
    { returnDocument: 'after', upsert: true },
  ).lean()

  await recordEvent({ visitorId, sessionId, userId, type: 'session_start', room: normalizeRoom(room) })

  res.json({ session })
})

router.post('/events', async (req, res) => {
  const { visitorId, sessionId, type, room = 'home', metadata = {} } = req.body
  const user = await getAuthenticatedUser(req)
  const userId = user ? String(user._id) : ''

  if (!visitorId || !sessionId || !type) {
    res.status(400).json({ error: 'Missing event fields' })
    return
  }

  const session = await Session.findOne({ sessionId }).select('userId lastActiveAt lastRoom roomDurations durationSeconds')
  if (session) {
    if (userId && !session.userId) session.userId = userId
    applySessionActivity(session, normalizeRoom(room))
    await session.save()
  }

  const event = await recordEvent({ visitorId, sessionId, userId, type, room, metadata })
  if (!event) {
    res.status(400).json({ error: 'Invalid event type' })
    return
  }

  res.json({ event })
})

router.post('/heartbeat', async (req, res) => {
  const { visitorId, sessionId, room = 'home' } = req.body
  const user = await getAuthenticatedUser(req)
  const userId = user ? String(user._id) : ''

  if (!visitorId || !sessionId) {
    res.status(400).json({ error: 'Missing heartbeat fields' })
    return
  }

  const session = await Session.findOne({ sessionId }).select('userId lastActiveAt lastRoom roomDurations durationSeconds')
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }

  applySessionActivity(session, normalizeRoom(room))
  if (userId && !session.userId) session.userId = userId
  await session.save()
  await Visitor.updateOne({ visitorId }, { $set: { lastSeenAt: new Date() } })

  res.json({ ok: true })
})

router.get('/me-report', requireUser, async (req, res) => {
  const visitorId = String(req.query.visitorId || '').trim()
  const period = ['day', 'week', 'month'].includes(req.query.period) ? req.query.period : 'week'
  let start
  let end

  if (!visitorId) {
    res.status(400).json({ error: 'Missing visitorId' })
    return
  }

  try {
    const range = getDateRange(period, req.query.date)
    start = range.start
    end = range.end
  } catch {
    res.status(400).json({ error: 'Invalid date' })
    return
  }

  const userId = String(req.user._id)
  const currentVisitorMatch = visitorId ? { visitorId } : null
  const accountMatch = currentVisitorMatch
    ? { $or: [{ userId }, currentVisitorMatch] }
    : { userId }
  const eventMatch = { ...accountMatch, createdAt: { $gte: start, $lt: end } }
  const sessionMatch = { ...accountMatch, startedAt: { $gte: start, $lt: end } }
  const [visitor, roomEvents, topEvents, sessions] = await Promise.all([
    Visitor.findOne({ visitorId }).lean(),
    AnalyticsEvent.aggregate([
      { $match: { ...eventMatch, type: 'room_view' } },
      { $group: { _id: '$room', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: eventMatch },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Session.find(sessionMatch)
      .select('lastRoom roomDurations durationSeconds')
      .lean(),
  ])

  const { totalDurationSeconds, roomDurations, stoppedRooms } = applySessionStats(sessions)

  res.json({
    period,
    start,
    end,
    user: {
      id: String(req.user._id),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'user',
      age: req.user.age || null,
      gender: req.user.gender || '',
      ageGroup: req.user.ageGroup || '',
    },
    visitor,
    totals: {
      sessions: sessions.length,
      events: topEvents.reduce((sum, item) => sum + item.count, 0),
      roomViews: roomEvents.reduce((sum, item) => sum + item.views, 0),
      totalDurationSeconds,
      averageSessionSeconds: sessions.length ? Math.round(totalDurationSeconds / sessions.length) : 0,
    },
    roomViews: roomEvents,
    roomDurations,
    stoppedRooms,
    events: topEvents,
  })
})

router.get('/focus-total', requireUser, async (req, res) => {
  const userId = String(req.user._id)
  const [focusTotal] = await AnalyticsEvent.aggregate([
    {
      $match: {
        userId,
        type: 'timer_start',
        room: 'focus-room',
        'metadata.phase': 'focus',
      },
    },
    {
      $group: {
        _id: null,
        totalIceCubes: { $sum: { $toDouble: { $ifNull: ['$metadata.iceCubeCount', 0] } } },
      },
    },
  ])
  const totalFocusSeconds = Math.round(Number(focusTotal?.totalIceCubes || 0) * iceCubeSeconds)

  res.json({
    totalFocusMinutes: Math.round(totalFocusSeconds / 60),
    totalFocusSeconds,
  })
})

router.get('/report', requireAdmin, async (req, res) => {
  const period = ['day', 'week', 'month'].includes(req.query.period) ? req.query.period : 'day'
  let start
  let end

  try {
    const range = getDateRange(period, req.query.date)
    start = range.start
    end = range.end
  } catch {
    res.status(400).json({ error: 'Invalid date' })
    return
  }

  const [visitorsByGender, visitorsByAge, roomEvents, topEvents, sessions, feedbackCount, feedbacks] = await Promise.all([
    Visitor.aggregate([
      { $match: { firstSeenAt: { $gte: start, $lt: end } } },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Visitor.aggregate([
      { $match: { firstSeenAt: { $gte: start, $lt: end } } },
      { $group: { _id: '$ageGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, type: 'room_view' } },
      { $group: { _id: '$room', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Session.find({ startedAt: { $gte: start, $lt: end } })
      .select('lastRoom roomDurations durationSeconds')
      .lean(),
    Feedback.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    Feedback.find({ createdAt: { $gte: start, $lt: end } })
      .select('name email message createdAt')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ])

  const { totalDurationSeconds, roomDurations, stoppedRooms } = applySessionStats(sessions)

  res.json({
    period,
    start,
    end,
    totals: {
      visitors: visitorsByGender.reduce((sum, item) => sum + item.count, 0),
      sessions: sessions.length,
      feedbacks: feedbackCount,
      totalDurationSeconds,
      averageSessionSeconds: sessions.length ? Math.round(totalDurationSeconds / sessions.length) : 0,
    },
    visitorsByGender,
    visitorsByAge,
    roomViews: roomEvents,
    roomDurations,
    stoppedRooms,
    events: topEvents,
    feedbacks,
  })
})

export default router
