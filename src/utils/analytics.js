import { iceCubeSeconds } from '../config/appConfig'

const visitorIdStorageKey = 'love-yourself-visitor-id'
const sessionIdStorageKey = 'love-yourself-session-id'
const legacyVisitorProfileStorageKey = 'love-yourself-visitor-profile'
const dailyJourneyStorageKey = 'love-yourself-daily-journey'
const returnStreakStorageKey = 'love-yourself-return-streak'
const returnStreakMilestones = [1, 2, 3, 4, 5, 6, 7]

export const dailyJourneyChangedEventName = 'love-yourself-daily-journey-changed'
export const returnStreakChangedEventName = 'love-yourself-return-streak-changed'

function getTodayKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDateFromKey(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number)
  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

function getDayDiff(fromDateKey, toDateKey) {
  const fromDate = getDateFromKey(fromDateKey)
  const toDate = getDateFromKey(toDateKey)
  if (!fromDate || !toDate) return null

  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000)
}

function getEmptyDailyJourney(date = getTodayKey()) {
  return {
    date,
    quoteOpened: false,
    focusMinutes: 0,
    communityReadCount: 0,
    communityWrittenCount: 0,
    musicListened: false,
    relaxationPlayed: false,
  }
}

export function getDailyJourney() {
  if (typeof window === 'undefined') return getEmptyDailyJourney()

  try {
    const todayKey = getTodayKey()
    const storedJourney = JSON.parse(window.localStorage.getItem(dailyJourneyStorageKey) || 'null')

    if (storedJourney?.date !== todayKey) return getEmptyDailyJourney(todayKey)

    return {
      ...getEmptyDailyJourney(todayKey),
      ...storedJourney,
      focusMinutes: Number(storedJourney.focusMinutes || 0),
      communityReadCount: Number(storedJourney.communityReadCount || 0),
      communityWrittenCount: Number(storedJourney.communityWrittenCount || 0),
    }
  } catch {
    return getEmptyDailyJourney()
  }
}

export function getReturnStreak() {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, lastVisitDate: '', milestones: returnStreakMilestones, visitedDates: [] }
  }

  try {
    const storedStreak = JSON.parse(window.localStorage.getItem(returnStreakStorageKey) || 'null')
    const visitedDates = Array.isArray(storedStreak?.visitedDates)
      ? [...new Set(storedStreak.visitedDates.filter(Boolean))].sort()
      : storedStreak?.lastVisitDate
        ? [String(storedStreak.lastVisitDate)]
        : []

    return {
      currentStreak: Math.max(0, Number(storedStreak?.currentStreak || 0)),
      lastVisitDate: String(storedStreak?.lastVisitDate || ''),
      milestones: returnStreakMilestones,
      visitedDates,
    }
  } catch {
    return { currentStreak: 0, lastVisitDate: '', milestones: returnStreakMilestones, visitedDates: [] }
  }
}

export function updateReturnStreak() {
  if (typeof window === 'undefined') return getReturnStreak()

  const todayKey = getTodayKey()
  const currentStreak = getReturnStreak()
  const dayDiff = getDayDiff(currentStreak.lastVisitDate, todayKey)
  let nextStreak

  if (!currentStreak.lastVisitDate) {
    nextStreak = 1
  } else if (dayDiff === 0) {
    nextStreak = Math.max(1, currentStreak.currentStreak)
  } else if (dayDiff === 1) {
    nextStreak = currentStreak.currentStreak + 1
  } else {
    nextStreak = 1
  }

  const nextValue = {
    currentStreak: nextStreak,
    lastVisitDate: todayKey,
    milestones: returnStreakMilestones,
    visitedDates: [...new Set([...currentStreak.visitedDates, todayKey])].sort(),
  }

  try {
    window.localStorage.setItem(returnStreakStorageKey, JSON.stringify(nextValue))
    window.dispatchEvent(new CustomEvent(returnStreakChangedEventName, { detail: { streak: nextValue } }))
  } catch {
    // Return streak is a local convenience card.
  }

  return nextValue
}

function storeDailyJourney(journey) {
  try {
    window.localStorage.setItem(dailyJourneyStorageKey, JSON.stringify(journey))
    window.dispatchEvent(new CustomEvent(dailyJourneyChangedEventName, { detail: { journey } }))
  } catch {
    // Daily journey is only a local convenience card.
  }
}

export function recordDailyJourney(type, room = 'home', metadata = {}) {
  if (typeof window === 'undefined') return

  const journey = getDailyJourney()

  if (type === 'letter_open' && room === 'card-room') {
    journey.quoteOpened = true
  }

  if (type === 'timer_start' && room === 'focus-room' && metadata.phase === 'focus') {
    const nextMinutes = Math.round((Number(metadata.iceCubeCount || 0) * iceCubeSeconds) / 60)
    journey.focusMinutes = Math.max(journey.focusMinutes, nextMinutes)
  }

  if (type === 'spotify_view' || room === 'sound-room' || room === 'play-room') {
    journey.musicListened = true
  }

  if (type === 'community_letter_read') {
    journey.communityReadCount += 1
  }

  if (type === 'community_letter_write') {
    journey.communityWrittenCount += 1
  }

  if (type === 'healing_play' || room === 'healing-room') {
    journey.relaxationPlayed = true
  }

  storeDailyJourney(journey)
}

function createId(prefix) {
  if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getStoredId(storage, key, prefix) {
  try {
    const existingId = storage.getItem(key)
    if (existingId) return existingId

    const nextId = createId(prefix)
    storage.setItem(key, nextId)
    return nextId
  } catch {
    return createId(prefix)
  }
}

export function getAnalyticsIds() {
  return {
    visitorId: getStoredId(localStorage, visitorIdStorageKey, 'visitor'),
    sessionId: getStoredId(sessionStorage, sessionIdStorageKey, 'session'),
  }
}

export function clearVisitorIdentity() {
  try {
    localStorage.removeItem(visitorIdStorageKey)
    localStorage.removeItem(legacyVisitorProfileStorageKey)
    sessionStorage.removeItem(sessionIdStorageKey)
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
}

function sendAnalytics(path, payload, { beacon = false } = {}) {
  const body = JSON.stringify(payload)

  if (beacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon(path, blob)
    return Promise.resolve()
  }

  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: beacon,
  }).catch(() => undefined)
}

export async function identifyVisitor(profile) {
  const response = await fetch('/api/analytics/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...getAnalyticsIds(),
      ...profile,
    }),
  })

  if (!response.ok) {
    throw new Error('Unable to save visitor profile')
  }

  const data = await response.json()
  return data.visitor
}

export async function getVisitorProfile() {
  const { visitorId } = getAnalyticsIds()
  const response = await fetch(`/api/analytics/profile/${encodeURIComponent(visitorId)}`)

  if (response.status === 404) return null
  if (!response.ok) throw new Error('Unable to load visitor profile')

  const data = await response.json()
  return data.visitor
}

export function startAnalyticsSession(room = 'home') {
  return sendAnalytics('/api/analytics/sessions', {
    ...getAnalyticsIds(),
    room,
    referrer: document.referrer,
  })
}

export function trackAnalyticsEvent(type, room = 'home', metadata = {}) {
  recordDailyJourney(type, room, metadata)

  return sendAnalytics('/api/analytics/events', {
    ...getAnalyticsIds(),
    type,
    room,
    metadata,
  })
}

export function sendAnalyticsHeartbeat(room = 'home', options) {
  return sendAnalytics(
    '/api/analytics/heartbeat',
    {
      ...getAnalyticsIds(),
      room,
    },
    options,
  )
}
