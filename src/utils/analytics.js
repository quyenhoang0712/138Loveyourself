const visitorIdStorageKey = 'love-yourself-visitor-id'
const sessionIdStorageKey = 'love-yourself-session-id'

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

export function identifyVisitor(profile) {
  return sendAnalytics('/api/analytics/identify', {
    ...getAnalyticsIds(),
    ...profile,
  })
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
  return sendAnalytics('/api/analytics/heartbeat', {
    ...getAnalyticsIds(),
    room,
  }, options)
}
