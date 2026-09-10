import crypto from 'crypto'

const cookieName = 'love_yourself_analytics'
const identityDuration = 180 * 24 * 60 * 60 * 1000

function getSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || ''
  if (secret && Buffer.byteLength(secret) >= 32) return secret
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SESSION_SECRET phải có ít nhất 32 byte trong production.')
  return 'development-only-change-me'
}

function isSecure(req) {
  return process.env.NODE_ENV === 'production' || req.get('x-forwarded-proto') === 'https'
}

function resolvedCookieName(req) {
  return isSecure(req) ? `__Host-${cookieName}` : cookieName
}

function readCookie(req, name) {
  return String(req.get('cookie') || '').split(';').reduce((value, item) => {
    const [itemName, ...itemValue] = item.trim().split('=')
    return itemName === name ? decodeURIComponent(itemValue.join('=')) : value
  }, '')
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url')
}

export function createVisitorId() {
  return `visitor-${crypto.randomUUID()}`
}

export function isValidSessionId(value) {
  return /^session-[A-Za-z0-9-]{16,80}$/.test(String(value || ''))
}

export function readAnalyticsVisitorId(req) {
  const signed = readCookie(req, resolvedCookieName(req)) || readCookie(req, cookieName)
  const separator = signed.lastIndexOf('.')
  if (separator < 1) return ''
  const value = signed.slice(0, separator)
  const signature = signed.slice(separator + 1)
  const expected = sign(value)
  if (signature.length !== expected.length) return ''
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? value : ''
}

export function setAnalyticsVisitorCookie(req, res, visitorId) {
  res.cookie(resolvedCookieName(req), `${visitorId}.${sign(visitorId)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure(req),
    maxAge: identityDuration,
    path: '/',
  })
}
