import crypto from 'crypto'
import { promisify } from 'util'
import { Router } from 'express'
import { Resend } from 'resend'
import { AuthRateLimit } from '../models/AuthRateLimit.js'
import { AuthSession } from '../models/AuthSession.js'
import { EmailVerification } from '../models/EmailVerification.js'
import { User } from '../models/User.js'
import { getAgeGroup } from '../utils/analytics.js'

const router = Router()
const scrypt = promisify(crypto.scrypt)
const sessionCookieName = 'love_yourself_session'
const googleStateCookieName = 'love_yourself_google_state'
const facebookStateCookieName = 'love_yourself_facebook_state'
const sessionDuration = 7 * 24 * 60 * 60 * 1000
const googleStateDuration = 10 * 60 * 1000
const mobileAuthTokenDuration = 2 * 60 * 1000
const emailVerificationDuration = 30 * 60 * 1000
const minimumPasswordLength = 15
const maximumPasswordLength = 128
const maximumEmailLength = 254
const maximumNameLength = 80
const returnStreakMilestones = [1, 2, 3, 4, 5, 6, 7]
let resendClient = null

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase().slice(0, maximumEmailLength + 1)
}

function isValidEmail(email) {
  return email.length <= maximumEmailLength && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizeGender(gender) {
  return ['male', 'female', 'other'].includes(gender) ? gender : ''
}

function getTodayKey() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(new Date()).reduce((value, part) => ({
    ...value,
    [part.type]: part.value,
  }), {})

  return `${parts.year}-${parts.month}-${parts.day}`
}

function getDateFromKey(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number)
  if (!year || !month || !day) return null

  return new Date(Date.UTC(year, month - 1, day))
}

function getPreviousDateKey(dateKey) {
  const date = getDateFromKey(dateKey)
  if (!date) return ''

  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

function normalizeVisitedDates(dates) {
  return [...new Set((Array.isArray(dates) ? dates : [])
    .map((date) => String(date || '').trim())
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)))]
    .sort()
}

function getReturnStreakFromDates(visitedDates, todayKey = getTodayKey()) {
  const visitedDateSet = new Set(normalizeVisitedDates(visitedDates))
  visitedDateSet.add(todayKey)

  let currentStreak = 0
  let cursorKey = todayKey

  while (visitedDateSet.has(cursorKey)) {
    currentStreak += 1
    cursorKey = getPreviousDateKey(cursorKey)
  }

  const sortedDates = [...visitedDateSet].sort()

  return {
    currentStreak,
    lastVisitDate: todayKey,
    milestones: returnStreakMilestones,
    visitedDates: sortedDates,
  }
}

function normalizeReturnStreak(streak) {
  const visitedDates = normalizeVisitedDates(streak?.visitedDates)
  const lastVisitDate = String(streak?.lastVisitDate || '')

  return {
    currentStreak: Math.max(0, Number(streak?.currentStreak || 0)),
    lastVisitDate,
    milestones: returnStreakMilestones,
    visitedDates: visitedDates.length ? visitedDates : normalizeVisitedDates([lastVisitDate]),
  }
}

function getCookie(req, name) {
  const cookies = req.get('cookie') || ''

  return cookies.split(';').reduce((value, cookie) => {
    const [cookieName, ...cookieValue] = cookie.trim().split('=')
    return cookieName === name ? decodeURIComponent(cookieValue.join('=')) : value
  }, '')
}

function getOrigin(req) {
  const protocol = isSecureRequest(req) ? 'https' : req.protocol || 'http'
  const host = req.get('host')
  const normalizedHost = process.env.NODE_ENV === 'production'
    ? host
    : host.replace(/^127\.0\.0\.1(?=:|$)/, 'localhost')

  return `${protocol}://${normalizedHost}`
}

function getGoogleRedirectUri(req) {
  return process.env.GOOGLE_REDIRECT_URI || `${getOrigin(req)}/api/auth/google/callback`
}

function getFacebookRedirectUri(req) {
  return process.env.NODE_ENV === 'production' && process.env.FACEBOOK_REDIRECT_URI
    ? process.env.FACEBOOK_REDIRECT_URI
    : `${getOrigin(req)}/api/auth/facebook/callback`
}

function getFacebookApiVersion() {
  return process.env.FACEBOOK_API_VERSION || 'v20.0'
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || ''

  if (secret && Buffer.byteLength(secret) >= 32) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SESSION_SECRET phải có ít nhất 32 byte trong production.')
  }

  return 'development-only-change-me'
}

function isSecureRequest(req) {
  return process.env.NODE_ENV === 'production' || req.get('x-forwarded-proto') === 'https'
}

function getSecureCookieName(req, name) {
  return isSecureRequest(req) ? `__Host-${name}` : name
}

function getNamedCookie(req, name) {
  return getCookie(req, getSecureCookieName(req, name)) || getCookie(req, name)
}

function getCookieOptions(req, maxAge) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    ...(maxAge ? { maxAge } : {}),
    path: '/',
  }
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

function createSignedPayload(payload) {
  return sign(Buffer.from(JSON.stringify(payload)).toString('base64url'))
}

function readSignedPayload(signedValue) {
  try {
    const payload = verify(String(signedValue || ''))
    if (!payload) return null

    const value = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return value.expiresAt > Date.now() ? value : null
  } catch {
    return null
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex')
}

function hashIdentifier(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(String(value || '')).digest('hex')
}

function getClientIdentifier(req) {
  return hashIdentifier(req.ip || req.socket?.remoteAddress || 'unknown')
}

async function createStoredToken(req, userId, kind, duration) {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + duration)

  await AuthSession.create({
    tokenHash: hashToken(token),
    userId,
    kind,
    userAgent: String(req.get('user-agent') || '').slice(0, 300),
    ipHash: getClientIdentifier(req),
    expiresAt,
  })

  return {
    signedToken: createSignedPayload({ token, expiresAt: expiresAt.getTime() }),
    expiresAt,
  }
}

function createGoogleState(payload) {
  return createSignedPayload({
    ...payload,
    nonce: crypto.randomBytes(16).toString('hex'),
    expiresAt: Date.now() + googleStateDuration,
  })
}

async function createMobileAuthToken(req, userId) {
  const { signedToken } = await createStoredToken(req, userId, 'mobile-exchange', mobileAuthTokenDuration)
  return signedToken
}

async function getAuthenticatedSession(req) {
  if (Object.hasOwn(req, 'authenticatedSession')) return req.authenticatedSession

  const payload = readSignedPayload(getNamedCookie(req, sessionCookieName))
  if (!payload?.token) {
    req.authenticatedSession = null
    return null
  }

  const session = await AuthSession.findOne({
    tokenHash: hashToken(payload.token),
    kind: 'session',
    expiresAt: { $gt: new Date() },
  }).lean()

  req.authenticatedSession = session || null
  return req.authenticatedSession
}

function readGoogleState(req) {
  return readSignedPayload(getNamedCookie(req, googleStateCookieName))
}

async function consumeMobileAuthToken(token) {
  const payload = readSignedPayload(token)
  if (!payload?.token) return null

  return AuthSession.findOneAndDelete({
    tokenHash: hashToken(payload.token),
    kind: 'mobile-exchange',
    expiresAt: { $gt: new Date() },
  }).lean()
}

export async function getAuthenticatedUser(req) {
  const session = await getAuthenticatedSession(req)
  return session
    ? User.findById(session.userId)
      .select('name email role age gender ageGroup authProvider googleId facebookId emailVerifiedAt returnStreak +passwordHash')
      .lean()
    : null
}

async function setSessionCookie(req, res, userId) {
  const { signedToken } = await createStoredToken(req, userId, 'session', sessionDuration)
  const cookieName = getSecureCookieName(req, sessionCookieName)

  res.cookie(cookieName, signedToken, getCookieOptions(req, sessionDuration))
  if (cookieName !== sessionCookieName) {
    res.clearCookie(sessionCookieName, getCookieOptions(req))
  }
}

async function clearSession(req, res) {
  const payload = readSignedPayload(getNamedCookie(req, sessionCookieName))
  if (payload?.token) {
    await AuthSession.deleteOne({ tokenHash: hashToken(payload.token), kind: 'session' })
  }

  const cookieNames = new Set([sessionCookieName, getSecureCookieName(req, sessionCookieName)])
  cookieNames.forEach((cookieName) => res.clearCookie(cookieName, getCookieOptions(req)))
}

function setGoogleStateCookie(req, res, state) {
  res.cookie(getSecureCookieName(req, googleStateCookieName), state, getCookieOptions(req, googleStateDuration))
}

function clearGoogleStateCookie(req, res) {
  const cookieNames = new Set([googleStateCookieName, getSecureCookieName(req, googleStateCookieName)])
  cookieNames.forEach((cookieName) => res.clearCookie(cookieName, getCookieOptions(req)))
}

function setFacebookStateCookie(req, res, state) {
  res.cookie(getSecureCookieName(req, facebookStateCookieName), state, getCookieOptions(req, googleStateDuration))
}

function clearFacebookStateCookie(req, res) {
  const cookieNames = new Set([facebookStateCookieName, getSecureCookieName(req, facebookStateCookieName)])
  cookieNames.forEach((cookieName) => res.clearCookie(cookieName, getCookieOptions(req)))
}

async function enforceRateLimit(req, res, {
  scope,
  limit,
  windowMs,
  identity = '',
  includeClient = true,
}) {
  const now = Date.now()
  const bucket = Math.floor(now / windowMs)
  const clientIdentifier = includeClient ? getClientIdentifier(req) : 'all-clients'
  const key = hashIdentifier(`${scope}:${clientIdentifier}:${identity}:${bucket}`)
  const expiresAt = new Date((bucket + 2) * windowMs)
  let entry

  try {
    entry = await AuthRateLimit.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { scope, expiresAt },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: false },
    ).lean()
  } catch (error) {
    if (error?.code !== 11000) throw error
    entry = await AuthRateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 } },
      { returnDocument: 'after' },
    ).lean()
  }

  if ((entry?.count || 0) <= limit) return true

  const retryAfterSeconds = Math.max(1, Math.ceil(((bucket + 1) * windowMs - now) / 1000))
  res.set('Retry-After', String(retryAfterSeconds))
  res.status(429).json({ error: 'Bạn thử quá nhiều lần rồi. Chờ một chút rồi thử lại nha.' })
  return false
}

function getVerificationOrigin(req) {
  const configuredOrigin = String(
    process.env.APP_ORIGIN
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ''),
  ).trim()
  const origin = configuredOrigin || getOrigin(req)

  try {
    return new URL(origin).origin
  } catch {
    throw new Error('APP_ORIGIN chưa hợp lệ.')
  }
}

function getResendClient() {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM) return null
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function sendVerificationEmail(req, verification, rawToken) {
  const client = getResendClient()
  if (!client) throw new Error('Email verification chưa được cấu hình.')

  const verificationUrl = new URL('/api/auth/verify-email', getVerificationOrigin(req))
  verificationUrl.searchParams.set('token', rawToken)
  const safeName = escapeHtml(verification.name)
  const safeUrl = escapeHtml(verificationUrl.toString())
  const { error } = await client.emails.send(
    {
      from: process.env.AUTH_EMAIL_FROM,
      to: verification.email,
      subject: 'Xác minh tài khoản LOVE YOURSELF',
      text: `Chào ${verification.name}, mở link này trong 30 phút để xác minh tài khoản: ${verificationUrl}`,
      html: `<p>Chào ${safeName},</p><p>Mở liên kết bên dưới trong 30 phút để xác minh tài khoản LOVE YOURSELF:</p><p><a href="${safeUrl}">Xác minh email</a></p><p>Nếu bạn không tạo tài khoản này, hãy bỏ qua email.</p>`,
    },
    {
      headers: { 'Idempotency-Key': `verify-${verification.tokenHash}` },
    },
  )

  if (error) throw new Error(error.message || 'Chưa gửi được email xác minh.')
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64)
  return { hash: hash.toString('hex'), salt }
}

async function isPasswordValid(password, user) {
  if (!user.passwordHash || !user.passwordSalt) return false

  const { hash } = await hashPassword(password, user.passwordSalt)
  const suppliedHash = Buffer.from(hash, 'hex')
  const storedHash = Buffer.from(user.passwordHash, 'hex')

  return suppliedHash.length === storedHash.length && crypto.timingSafeEqual(suppliedHash, storedHash)
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    age: user.age || null,
    gender: user.gender || '',
    ageGroup: user.ageGroup || '',
    authProvider: user.authProvider || 'password',
    emailVerified: Boolean(user.emailVerifiedAt),
    hasPassword: Boolean(user.passwordHash) && !user.googleId && !user.facebookId,
    returnStreak: normalizeReturnStreak(user.returnStreak),
  }
}

function safeReturnTo(returnTo) {
  const value = String(returnTo || '').trim()
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/auth')) return '/'
  return value
}

function safeMobileReturnTo(returnTo) {
  const value = String(returnTo || '').trim()
  if (!value) return ''

  try {
    const url = new URL(value)
    return ['exp:', '138-love-yourself:'].includes(url.protocol) ? value : ''
  } catch {
    return ''
  }
}

function redirectWithAuthError(req, res, message) {
  res.redirect(`/auth?authError=${encodeURIComponent(message)}`)
}

async function getGoogleTokens(req, code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: getGoogleRedirectUri(req),
      grant_type: 'authorization_code',
    }),
  })
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || 'Google chưa trả phiên đăng nhập hợp lệ.')
  }

  return data
}

async function getGoogleProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const profile = await response.json().catch(() => null)

  if (!response.ok || !profile?.id || !profile?.email) {
    throw new Error('Chưa lấy được thông tin Gmail từ Google.')
  }

  if (!profile.verified_email) {
    throw new Error('Gmail này chưa được Google xác minh.')
  }

  return profile
}

async function getFacebookTokens(req, code) {
  const tokenUrl = new URL(`https://graph.facebook.com/${getFacebookApiVersion()}/oauth/access_token`)
  tokenUrl.searchParams.set('client_id', process.env.FACEBOOK_APP_ID || '')
  tokenUrl.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET || '')
  tokenUrl.searchParams.set('redirect_uri', getFacebookRedirectUri(req))
  tokenUrl.searchParams.set('code', code)

  const response = await fetch(tokenUrl)
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error?.message || 'Facebook chưa trả phiên đăng nhập hợp lệ.')
  }

  return data
}

async function getFacebookProfile(accessToken) {
  const profileUrl = new URL(`https://graph.facebook.com/${getFacebookApiVersion()}/me`)
  profileUrl.searchParams.set('fields', 'id,name,email')
  profileUrl.searchParams.set('access_token', accessToken)

  const response = await fetch(profileUrl)
  const profile = await response.json().catch(() => null)

  if (!response.ok || !profile?.id) {
    throw new Error(profile?.error?.message || 'Chưa lấy được thông tin Facebook.')
  }

  if (!profile.email) {
    throw new Error('Facebook chưa cung cấp email cho tài khoản này.')
  }

  return profile
}

router.get('/config', (req, res) => {
  res.json({
    passwordRegistrationEnabled: Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM),
    googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebookEnabled: Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
  })
})

router.get('/google/start', async (req, res) => {
  if (!await enforceRateLimit(req, res, { scope: 'google-start', limit: 30, windowMs: 15 * 60 * 1000 })) return

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirectWithAuthError(req, res, 'Google Login chưa được cấu hình.')
    return
  }

  const age = Number(req.query.age)
  const gender = normalizeGender(req.query.gender)
  const state = createGoogleState({
    returnTo: safeReturnTo(req.query.returnTo),
    mobileReturnTo: safeMobileReturnTo(req.query.mobileReturnTo),
    age: Number.isInteger(age) && age >= 1 && age <= 120 ? age : null,
    gender,
  })

  setGoogleStateCookie(req, res, state)

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', getGoogleRedirectUri(req))
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('prompt', 'select_account')

  res.redirect(authUrl.toString())
})

router.get('/google/callback', async (req, res) => {
  const storedState = readGoogleState(req)
  const returnedState = String(req.query.state || '')
  const code = String(req.query.code || '')

  clearGoogleStateCookie(req, res)

  if (!storedState || !returnedState || getNamedCookie(req, googleStateCookieName) !== returnedState) {
    redirectWithAuthError(req, res, 'Phiên đăng nhập Google đã hết hạn, bạn thử lại nha.')
    return
  }

  if (!code) {
    redirectWithAuthError(req, res, 'Google chưa xác nhận đăng nhập.')
    return
  }

  try {
    const tokens = await getGoogleTokens(req, code)
    const profile = await getGoogleProfile(tokens.access_token)
    const email = normalizeEmail(profile.email)
    const age = Number(storedState.age)
    const gender = normalizeGender(storedState.gender)

    let user = await User.findOne({ googleId: profile.id })
      .select('name email role age gender ageGroup authProvider googleId emailVerifiedAt lastLoginAt +passwordHash')

    if (user) {
      user.authProvider = 'google'
      user.emailVerifiedAt = user.emailVerifiedAt || new Date()
      user.lastLoginAt = new Date()

      if (!user.name && profile.name) user.name = profile.name
      if (!user.age && Number.isInteger(age) && age >= 1 && age <= 120) {
        user.age = age
        user.ageGroup = getAgeGroup(age)
      }
      if (!user.gender && gender) user.gender = gender
    } else {
      if (await User.exists({ email })) {
        throw new Error('Email này đã có tài khoản. Hãy đăng nhập bằng phương thức đã đăng ký; hệ thống không tự ghép tài khoản để bảo vệ bạn.')
      }

      user = await User.create({
        name: String(profile.name || email.split('@')[0]).trim(),
        email,
        age: Number.isInteger(age) && age >= 1 && age <= 120 ? age : null,
        gender,
        ageGroup: Number.isInteger(age) && age >= 1 && age <= 120 ? getAgeGroup(age) : '',
        authProvider: 'google',
        googleId: profile.id,
        emailVerifiedAt: new Date(),
      })
    }

    await user.save()

    if (storedState.mobileReturnTo) {
      const redirectUrl = new URL(storedState.mobileReturnTo)
      redirectUrl.searchParams.set('authToken', await createMobileAuthToken(req, String(user._id)))
      res.redirect(redirectUrl.toString())
      return
    }

    await setSessionCookie(req, res, String(user._id))
    res.redirect(safeReturnTo(storedState.returnTo))
  } catch (error) {
    redirectWithAuthError(req, res, error.message || 'Chưa đăng nhập được bằng Google.')
  }
})

router.get('/facebook/start', async (req, res) => {
  if (!await enforceRateLimit(req, res, { scope: 'facebook-start', limit: 30, windowMs: 15 * 60 * 1000 })) return

  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    redirectWithAuthError(req, res, 'Facebook Login chưa được cấu hình.')
    return
  }

  const state = createGoogleState({
    returnTo: safeReturnTo(req.query.returnTo),
    mobileReturnTo: safeMobileReturnTo(req.query.mobileReturnTo),
  })

  setFacebookStateCookie(req, res, state)

  const authUrl = new URL(`https://www.facebook.com/${getFacebookApiVersion()}/dialog/oauth`)
  authUrl.searchParams.set('client_id', process.env.FACEBOOK_APP_ID)
  authUrl.searchParams.set('redirect_uri', getFacebookRedirectUri(req))
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'email,public_profile')
  authUrl.searchParams.set('state', state)

  res.redirect(authUrl.toString())
})

router.get('/facebook/callback', async (req, res) => {
  const storedState = readSignedPayload(getNamedCookie(req, facebookStateCookieName))
  const returnedState = String(req.query.state || '')
  const code = String(req.query.code || '')

  clearFacebookStateCookie(req, res)

  if (!storedState || !returnedState || getNamedCookie(req, facebookStateCookieName) !== returnedState) {
    redirectWithAuthError(req, res, 'Phiên đăng nhập Facebook đã hết hạn, bạn thử lại nha.')
    return
  }

  if (!code) {
    redirectWithAuthError(req, res, 'Facebook chưa xác nhận đăng nhập.')
    return
  }

  try {
    const tokens = await getFacebookTokens(req, code)
    const profile = await getFacebookProfile(tokens.access_token)
    const email = normalizeEmail(profile.email)

    let user = await User.findOne({ facebookId: profile.id })
      .select('name email role age gender ageGroup authProvider facebookId emailVerifiedAt lastLoginAt +passwordHash')

    if (user) {
      user.authProvider = 'facebook'
      user.emailVerifiedAt = user.emailVerifiedAt || new Date()
      user.lastLoginAt = new Date()
      if (!user.name && profile.name) user.name = profile.name
    } else {
      if (await User.exists({ email })) {
        throw new Error('Email này đã có tài khoản. Hãy đăng nhập bằng phương thức đã đăng ký; hệ thống không tự ghép tài khoản để bảo vệ bạn.')
      }

      user = await User.create({
        name: String(profile.name || email.split('@')[0]).trim(),
        email,
        authProvider: 'facebook',
        facebookId: profile.id,
        emailVerifiedAt: new Date(),
      })
    }

    await user.save()

    if (storedState.mobileReturnTo) {
      const redirectUrl = new URL(storedState.mobileReturnTo)
      redirectUrl.searchParams.set('authToken', await createMobileAuthToken(req, String(user._id)))
      res.redirect(redirectUrl.toString())
      return
    }

    await setSessionCookie(req, res, String(user._id))
    res.redirect(safeReturnTo(storedState.returnTo))
  } catch (error) {
    redirectWithAuthError(req, res, error.message || 'Chưa đăng nhập được bằng Facebook.')
  }
})

router.post('/mobile/session', async (req, res) => {
  if (!await enforceRateLimit(req, res, { scope: 'mobile-session', limit: 20, windowMs: 15 * 60 * 1000 })) return

  const session = await consumeMobileAuthToken(req.body?.authToken)
  if (!session) {
    res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn.' })
    return
  }

  const user = await User.findById(session.userId)
    .select('name email role age gender ageGroup authProvider googleId facebookId emailVerifiedAt returnStreak +passwordHash')
  if (!user) {
    res.status(401).json({ error: 'Tài khoản không còn tồn tại.' })
    return
  }

  await setSessionCookie(req, res, String(user._id))
  res.json({ message: 'Đăng nhập thành công!', user: publicUser(user) })
})

router.post('/register', async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')
  const age = Number(req.body.age)
  const gender = normalizeGender(req.body.gender)
  const hasValidProfile = Number.isInteger(age) && age >= 1 && age <= 120 && Boolean(gender)
  const returnTo = safeReturnTo(req.body.returnTo)

  if (!getResendClient()) {
    res.status(503).json({ error: 'Đăng ký bằng mật khẩu đang tạm khóa cho đến khi email verification được cấu hình.' })
    return
  }

  if (!await enforceRateLimit(req, res, { scope: 'register-ip', limit: 5, windowMs: 60 * 60 * 1000 })) return
  if (!await enforceRateLimit(req, res, {
    scope: 'register-email',
    limit: 3,
    windowMs: 60 * 60 * 1000,
    identity: email,
    includeClient: false,
  })) return

  if (
    name.length < 2
    || name.length > maximumNameLength
    || !isValidEmail(email)
    || password.length < minimumPasswordLength
    || password.length > maximumPasswordLength
  ) {
    res.status(400).json({ error: 'Thông tin đăng ký chưa hợp lệ.' })
    return
  }

  const { hash, salt } = await hashPassword(password)
  const genericMessage = 'Nếu email này có thể đăng ký, link xác minh đã được gửi và có hiệu lực trong 30 phút.'

  if (await User.exists({ email })) {
    res.status(202).json({ message: genericMessage, requiresVerification: true, user: null })
    return
  }

  const rawToken = crypto.randomBytes(32).toString('base64url')
  const tokenHash = hashToken(rawToken)
  const verification = await EmailVerification.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        passwordHash: hash,
        passwordSalt: salt,
        age: hasValidProfile ? age : null,
        gender: hasValidProfile ? gender : '',
        ageGroup: hasValidProfile ? getAgeGroup(age) : '',
        returnTo,
        tokenHash,
        expiresAt: new Date(Date.now() + emailVerificationDuration),
      },
    },
    { returnDocument: 'after', upsert: true },
  )

  try {
    await sendVerificationEmail(req, verification, rawToken)
  } catch (error) {
    await EmailVerification.deleteOne({ tokenHash })
    console.error('Verification email failed:', error)
    res.status(502).json({ error: 'Chưa gửi được email xác minh. Bạn thử lại sau nha.' })
    return
  }

  res.status(202).json({ message: genericMessage, requiresVerification: true, user: null })
})

router.get('/verify-email', async (req, res) => {
  if (!await enforceRateLimit(req, res, { scope: 'verify-email', limit: 30, windowMs: 15 * 60 * 1000 })) return

  const rawToken = String(req.query.token || '')
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(rawToken)) {
    redirectWithAuthError(req, res, 'Link xác minh chưa hợp lệ hoặc đã hết hạn.')
    return
  }

  const verification = await EmailVerification.findOneAndDelete({
    tokenHash: hashToken(rawToken),
    expiresAt: { $gt: new Date() },
  })

  if (!verification) {
    redirectWithAuthError(req, res, 'Link xác minh chưa hợp lệ hoặc đã hết hạn.')
    return
  }

  try {
    if (await User.exists({ email: verification.email })) {
      redirectWithAuthError(req, res, 'Email này đã có tài khoản. Hãy đăng nhập bằng phương thức đã đăng ký.')
      return
    }

    const user = await User.create({
      name: verification.name,
      email: verification.email,
      age: verification.age,
      gender: verification.gender,
      ageGroup: verification.ageGroup,
      authProvider: 'password',
      emailVerifiedAt: new Date(),
      passwordHash: verification.passwordHash,
      passwordSalt: verification.passwordSalt,
    })

    await setSessionCookie(req, res, String(user._id))
    res.redirect(safeReturnTo(verification.returnTo))
  } catch (error) {
    if (error?.code === 11000) {
      redirectWithAuthError(req, res, 'Email này đã có tài khoản. Hãy đăng nhập bằng phương thức đã đăng ký.')
      return
    }

    throw error
  }
})

router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')
  const age = Number(req.body.age)
  const gender = normalizeGender(req.body.gender)
  const isValidInput = isValidEmail(email) && password.length > 0 && password.length <= maximumPasswordLength

  if (!await enforceRateLimit(req, res, { scope: 'login-ip', limit: 60, windowMs: 15 * 60 * 1000 })) return
  if (!await enforceRateLimit(req, res, {
    scope: 'login-pair',
    limit: 10,
    windowMs: 15 * 60 * 1000,
    identity: email,
  })) return
  if (!await enforceRateLimit(req, res, {
    scope: 'login-account',
    limit: 20,
    windowMs: 15 * 60 * 1000,
    identity: email,
    includeClient: false,
  })) return

  const user = isValidInput
    ? await User.findOne({ email })
      .select('+passwordHash +passwordSalt name email role age gender ageGroup authProvider googleId facebookId emailVerifiedAt lastLoginAt')
    : null

  if (!user) {
    if (password.length <= maximumPasswordLength) {
      await hashPassword(password || 'invalid-password', '4e6f744156616c69645573657253616c74')
    }
    res.status(401).json({ error: 'Email hoặc mật khẩu chưa đúng.' })
    return
  }

  if (!(await isPasswordValid(password, user))) {
    res.status(401).json({ error: 'Email hoặc mật khẩu chưa đúng.' })
    return
  }

  if (user.googleId || user.facebookId) {
    res.status(403).json({
      error: `Tài khoản này đã được bảo vệ bằng ${user.googleId ? 'Google' : 'Facebook'}. Hãy dùng nút đăng nhập tương ứng.`,
    })
    return
  }

  user.authProvider = 'password'
  user.lastLoginAt = new Date()

  if (Number.isInteger(age) && age >= 1 && age <= 120 && gender) {
    user.age = age
    user.gender = gender
    user.ageGroup = getAgeGroup(age)
  }

  await user.save()
  await setSessionCookie(req, res, String(user._id))
  res.json({ message: 'Đăng nhập thành công!', user: publicUser(user) })
})

router.get('/me', async (req, res) => {
  const user = await getAuthenticatedUser(req)
  res.json({ user: user ? publicUser(user) : null })
})

router.post('/streak/visit', async (req, res) => {
  const session = await getAuthenticatedSession(req)
  if (!session) {
    res.status(401).json({ error: 'Bạn cần đăng nhập để lưu streak.' })
    return
  }

  const user = await User.findById(session.userId).select('returnStreak')
  if (!user) {
    res.status(401).json({ error: 'Phiên đăng nhập không còn hợp lệ.' })
    return
  }

  const currentStreak = normalizeReturnStreak(user.returnStreak)
  const localStreak = normalizeReturnStreak(req.body?.streak)
  const nextStreak = getReturnStreakFromDates([
    ...currentStreak.visitedDates,
    ...localStreak.visitedDates,
  ])

  user.returnStreak = {
    currentStreak: nextStreak.currentStreak,
    lastVisitDate: nextStreak.lastVisitDate,
    visitedDates: nextStreak.visitedDates,
  }

  await user.save()
  res.json({ streak: nextStreak })
})

router.patch('/me', async (req, res) => {
  const session = await getAuthenticatedSession(req)
  if (!session) {
    res.status(401).json({ error: 'Bạn cần đăng nhập để chỉnh sửa thông tin.' })
    return
  }

  if (!await enforceRateLimit(req, res, {
    scope: 'profile-update',
    limit: 30,
    windowMs: 60 * 60 * 1000,
    identity: String(session.userId),
    includeClient: false,
  })) return

  const name = String(req.body.name || '').trim()
  const age = Number(req.body.age)
  const gender = normalizeGender(req.body.gender)
  const password = String(req.body.password || '')
  const currentPassword = String(req.body.currentPassword || '')

  if (name.length < 2 || name.length > maximumNameLength || !Number.isInteger(age) || age < 1 || age > 120 || !gender) {
    res.status(400).json({ error: 'Tên, tuổi hoặc giới tính chưa hợp lệ.' })
    return
  }

  if (password && (password.length < minimumPasswordLength || password.length > maximumPasswordLength)) {
    res.status(400).json({ error: `Mật khẩu mới cần từ ${minimumPasswordLength} đến ${maximumPasswordLength} ký tự.` })
    return
  }

  const user = await User.findById(session.userId)
    .select('+passwordHash +passwordSalt name email role age gender ageGroup authProvider googleId facebookId emailVerifiedAt')

  if (!user) {
    res.status(401).json({ error: 'Phiên đăng nhập không còn hợp lệ.' })
    return
  }

  user.name = name
  user.age = age
  user.gender = gender
  user.ageGroup = getAgeGroup(age)

  if (password) {
    if (!user.passwordHash || !user.passwordSalt || user.googleId || user.facebookId) {
      res.status(400).json({ error: 'Tài khoản OAuth chưa thể đặt mật khẩu tại đây. Hãy tiếp tục đăng nhập bằng nhà cung cấp hiện tại.' })
      return
    }

    if (!currentPassword || !await isPasswordValid(currentPassword, user)) {
      res.status(401).json({ error: 'Mật khẩu hiện tại chưa đúng.' })
      return
    }

    const { hash, salt } = await hashPassword(password)
    user.passwordHash = hash
    user.passwordSalt = salt
  }

  await user.save()

  if (password) {
    await AuthSession.deleteMany({ userId: user._id })
    await setSessionCookie(req, res, String(user._id))
  }

  res.json({
    message: 'Đã cập nhật thông tin cá nhân.',
    user: publicUser(user),
  })
})

router.post('/logout', async (req, res) => {
  await clearSession(req, res)
  res.json({ ok: true })
})

export default router
