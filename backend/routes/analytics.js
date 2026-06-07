import { Router } from 'express'
import { AnalyticsEvent } from '../models/AnalyticsEvent.js'
import { Session } from '../models/Session.js'
import { Visitor } from '../models/Visitor.js'
import { applySessionActivity, getAgeGroup, getDateRange } from '../utils/analytics.js'

const router = Router()

const allowedRooms = new Set(['home', 'card-room', 'focus-room', 'sound-room', 'play-room'])
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
])

function normalizeRoom(room) {
  return allowedRooms.has(room) ? room : 'home'
}

function requireAdmin(req, res, next) {
  const expectedToken = process.env.ANALYTICS_ADMIN_TOKEN || 'change-me'
  const providedToken = req.get('x-admin-token') || req.query.token

  if (providedToken !== expectedToken) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}

async function recordEvent({ visitorId, sessionId, type, room, metadata = {} }) {
  if (!visitorId || !sessionId || !type) return null
  if (!allowedEvents.has(type)) return null

  return AnalyticsEvent.create({
    visitorId,
    sessionId,
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

  const visitor = await Visitor.findOneAndUpdate(
    { visitorId },
    {
      $set: {
        gender,
        ageGroup: getAgeGroup(normalizedAge),
        lastSeenAt: new Date(),
      },
      $setOnInsert: { firstSeenAt: new Date() },
    },
    { new: true, upsert: true },
  )

  if (sessionId) {
    await recordEvent({ visitorId, sessionId, type: 'profile_saved', room: 'home', metadata: { gender, ageGroup: visitor.ageGroup } })
  }

  res.json({ visitor })
})

router.post('/sessions', async (req, res) => {
  const { visitorId, sessionId, room = 'home', referrer = '' } = req.body

  if (!visitorId || !sessionId) {
    res.status(400).json({ error: 'Missing visitorId or sessionId' })
    return
  }

  const now = new Date()
  const session = await Session.findOneAndUpdate(
    { sessionId },
    {
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
    { new: true, upsert: true },
  )

  await recordEvent({ visitorId, sessionId, type: 'session_start', room: normalizeRoom(room) })

  res.json({ session })
})

router.post('/events', async (req, res) => {
  const { visitorId, sessionId, type, room = 'home', metadata = {} } = req.body

  if (!visitorId || !sessionId || !type) {
    res.status(400).json({ error: 'Missing event fields' })
    return
  }

  const session = await Session.findOne({ sessionId })
  if (session) {
    applySessionActivity(session, normalizeRoom(room))
    await session.save()
  }

  const event = await recordEvent({ visitorId, sessionId, type, room, metadata })
  if (!event) {
    res.status(400).json({ error: 'Invalid event type' })
    return
  }

  res.json({ event })
})

router.post('/heartbeat', async (req, res) => {
  const { visitorId, sessionId, room = 'home' } = req.body

  if (!visitorId || !sessionId) {
    res.status(400).json({ error: 'Missing heartbeat fields' })
    return
  }

  const session = await Session.findOne({ sessionId })
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }

  applySessionActivity(session, normalizeRoom(room))
  await session.save()
  await Visitor.updateOne({ visitorId }, { $set: { lastSeenAt: new Date() } })

  res.json({ ok: true })
})

router.get('/report', requireAdmin, async (req, res) => {
  const period = req.query.period === 'week' ? 'week' : 'day'
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

  const [visitorsByGender, visitorsByAge, roomEvents, topEvents, sessions] = await Promise.all([
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
    Session.find({ startedAt: { $gte: start, $lt: end } }).lean(),
  ])

  const durationByRoom = {}
  const lastRoomCounts = {}
  let totalDurationSeconds = 0

  sessions.forEach((session) => {
    lastRoomCounts[session.lastRoom] = (lastRoomCounts[session.lastRoom] || 0) + 1
    totalDurationSeconds += session.durationSeconds || 0

    Object.entries(session.roomDurations || {}).forEach(([room, seconds]) => {
      durationByRoom[room] = (durationByRoom[room] || 0) + seconds
    })
  })

  const roomDurations = Object.entries(durationByRoom)
    .map(([room, seconds]) => ({ room, seconds }))
    .sort((a, b) => b.seconds - a.seconds)

  const stoppedRooms = Object.entries(lastRoomCounts)
    .map(([room, count]) => ({ room, count }))
    .sort((a, b) => b.count - a.count)

  res.json({
    period,
    start,
    end,
    totals: {
      visitors: visitorsByGender.reduce((sum, item) => sum + item.count, 0),
      sessions: sessions.length,
      totalDurationSeconds,
      averageSessionSeconds: sessions.length ? Math.round(totalDurationSeconds / sessions.length) : 0,
    },
    visitorsByGender,
    visitorsByAge,
    roomViews: roomEvents,
    roomDurations,
    stoppedRooms,
    events: topEvents,
  })
})

export default router
