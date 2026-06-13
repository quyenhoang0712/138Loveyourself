const visitorIdStorageKey = 'love-yourself-visitor-id'
const sessionIdStorageKey = 'love-yourself-session-id'
const legacyVisitorProfileStorageKey = 'love-yourself-visitor-profile'

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
