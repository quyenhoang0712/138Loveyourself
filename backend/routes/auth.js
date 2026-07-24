import crypto from 'crypto'
import { promisify } from 'util'
import { Router } from 'express'
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
const returnStreakMilestones = [1, 2, 3, 4, 5, 6, 7]

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
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
  return process.env.AUTH_SESSION_SECRET || 'development-only-change-me'
}

function isSecureRequest(req) {
  return process.env.NODE_ENV === 'production' || req.get('x-forwarded-proto') === 'https'
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

function createSession(userId) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    expiresAt: Date.now() + sessionDuration,
  })).toString('base64url')

  return sign(payload)
}

function createGoogleState(payload) {
  return sign(Buffer.from(JSON.stringify({
    ...payload,
    nonce: crypto.randomBytes(16).toString('hex'),
    expiresAt: Date.now() + googleStateDuration,
  })).toString('base64url'))
}

function createMobileAuthToken(userId) {
  return sign(Buffer.from(JSON.stringify({
    userId,
    expiresAt: Date.now() + mobileAuthTokenDuration,
  })).toString('base64url'))
}

function readSession(req) {
  try {
    const payload = verify(getCookie(req, sessionCookieName))
    if (!payload) return null

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return session.expiresAt > Date.now() ? session : null
  } catch {
    return null
  }
}

function readGoogleState(req) {
  try {
    const payload = verify(getCookie(req, googleStateCookieName))
    if (!payload) return null

    const state = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return state.expiresAt > Date.now() ? state : null
  } catch {
    return null
  }
}

function readMobileAuthToken(token) {
  try {
    const payload = verify(String(token || ''))
    if (!payload) return null

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return session.expiresAt > Date.now() ? session : null
  } catch {
    return null
  }
}

export async function getAuthenticatedUser(req) {
  const session = readSession(req)
  return session
    ? User.findById(session.userId).select('name email role age gender ageGroup returnStreak').lean()
    : null
}

function setSessionCookie(req, res, userId) {
  res.cookie(sessionCookieName, createSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    maxAge: sessionDuration,
    path: '/',
  })
}

function clearSessionCookie(req, res) {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    path: '/',
  })
}

function setGoogleStateCookie(req, res, state) {
  res.cookie(googleStateCookieName, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    maxAge: googleStateDuration,
    path: '/',
  })
}

function clearGoogleStateCookie(req, res) {
  res.clearCookie(googleStateCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    path: '/',
  })
}

function setFacebookStateCookie(req, res, state) {
  res.cookie(facebookStateCookieName, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    maxAge: googleStateDuration,
    path: '/',
  })
}

function clearFacebookStateCookie(req, res) {
  res.clearCookie(facebookStateCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    path: '/',
  })
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

router.get('/google/start', (req, res) => {
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

  if (!storedState || !returnedState || getCookie(req, googleStateCookieName) !== returnedState) {
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

    let user = await User.findOne({
      $or: [
        { googleId: profile.id },
        { email },
      ],
    }).select('name email role age gender ageGroup authProvider googleId lastLoginAt')

    if (user) {
      user.googleId = user.googleId || profile.id
      user.authProvider = 'google'
      user.lastLoginAt = new Date()

      if (!user.name && profile.name) user.name = profile.name
      if (!user.age && Number.isInteger(age) && age >= 1 && age <= 120) {
        user.age = age
        user.ageGroup = getAgeGroup(age)
      }
      if (!user.gender && gender) user.gender = gender
    } else {
      user = await User.create({
        name: String(profile.name || email.split('@')[0]).trim(),
        email,
        age: Number.isInteger(age) && age >= 1 && age <= 120 ? age : null,
        gender,
        ageGroup: Number.isInteger(age) && age >= 1 && age <= 120 ? getAgeGroup(age) : '',
        authProvider: 'google',
        googleId: profile.id,
      })
    }

    await user.save()
    setSessionCookie(req, res, String(user._id))

    if (storedState.mobileReturnTo) {
      const redirectUrl = new URL(storedState.mobileReturnTo)
      redirectUrl.searchParams.set('authToken', createMobileAuthToken(String(user._id)))
      res.redirect(redirectUrl.toString())
      return
    }

    res.redirect(safeReturnTo(storedState.returnTo))
  } catch (error) {
    redirectWithAuthError(req, res, error.message || 'Chưa đăng nhập được bằng Google.')
  }
})

router.get('/facebook/start', (req, res) => {
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
  const storedState = (() => {
    try {
      const payload = verify(getCookie(req, facebookStateCookieName))
      if (!payload) return null
      const state = JSON.parse(Buffer.from(payload, 'base64url').toString())
      return state.expiresAt > Date.now() ? state : null
    } catch {
      return null
    }
  })()
  const returnedState = String(req.query.state || '')
  const code = String(req.query.code || '')

  clearFacebookStateCookie(req, res)

  if (!storedState || !returnedState || getCookie(req, facebookStateCookieName) !== returnedState) {
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

    let user = await User.findOne({
      $or: [
        { facebookId: profile.id },
        { email },
      ],
    }).select('name email role age gender ageGroup authProvider facebookId lastLoginAt')

    if (user) {
      user.facebookId = user.facebookId || profile.id
      user.authProvider = 'facebook'
      user.lastLoginAt = new Date()
      if (!user.name && profile.name) user.name = profile.name
    } else {
      user = await User.create({
        name: String(profile.name || email.split('@')[0]).trim(),
        email,
        authProvider: 'facebook',
        facebookId: profile.id,
      })
    }

    await user.save()
    setSessionCookie(req, res, String(user._id))

    if (storedState.mobileReturnTo) {
      const redirectUrl = new URL(storedState.mobileReturnTo)
      redirectUrl.searchParams.set('authToken', createMobileAuthToken(String(user._id)))
      res.redirect(redirectUrl.toString())
      return
    }

    res.redirect(safeReturnTo(storedState.returnTo))
  } catch (error) {
    redirectWithAuthError(req, res, error.message || 'Chưa đăng nhập được bằng Facebook.')
  }
})

router.post('/mobile/session', async (req, res) => {
  const session = readMobileAuthToken(req.body?.authToken)
  if (!session) {
    res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn.' })
    return
  }

  const user = await User.findById(session.userId).select('name email role age gender ageGroup returnStreak')
  if (!user) {
    res.status(401).json({ error: 'Tài khoản không còn tồn tại.' })
    return
  }

  setSessionCookie(req, res, String(user._id))
  res.json({ message: 'Đăng nhập thành công!', user: publicUser(user) })
})

router.post('/register', async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')
  const age = Number(req.body.age)
  const gender = normalizeGender(req.body.gender)
  const hasValidProfile = Number.isInteger(age) && age >= 1 && age <= 120 && Boolean(gender)

  if (name.length < 2 || !email.includes('@') || password.length < 6) {
    res.status(400).json({ error: 'Thông tin đăng ký chưa hợp lệ.' })
    return
  }

  if (await User.exists({ email })) {
    res.status(409).json({ error: 'Email này đã được đăng ký rồi.' })
    return
  }

  const { hash, salt } = await hashPassword(password)

  try {
    const user = await User.create({
      name,
      email,
      age: hasValidProfile ? age : null,
      gender: hasValidProfile ? gender : '',
      ageGroup: hasValidProfile ? getAgeGroup(age) : '',
      passwordHash: hash,
      passwordSalt: salt,
    })

    setSessionCookie(req, res, String(user._id))
    res.status(201).json({
      message: 'Tạo tài khoản thành công!',
      user: publicUser(user),
    })
  } catch (error) {
    if (error?.code === 11000) {
      res.status(409).json({ error: 'Email này đã được đăng ký rồi.' })
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
  const user = await User.findOne({ email }).select('+passwordHash +passwordSalt name email role age gender ageGroup lastLoginAt')

  if (!user || !(await isPasswordValid(password, user))) {
    res.status(401).json({ error: 'Email hoặc mật khẩu chưa đúng.' })
    return
  }

  user.lastLoginAt = new Date()

  if (Number.isInteger(age) && age >= 1 && age <= 120 && gender) {
    user.age = age
    user.gender = gender
    user.ageGroup = getAgeGroup(age)
  }

  await user.save()
  setSessionCookie(req, res, String(user._id))
  res.json({ message: 'Đăng nhập thành công!', user: publicUser(user) })
})

router.get('/me', async (req, res) => {
  const user = await getAuthenticatedUser(req)
  res.json({ user: user ? publicUser(user) : null })
})

router.post('/streak/visit', async (req, res) => {
  const session = readSession(req)
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
  const session = readSession(req)
  if (!session) {
    res.status(401).json({ error: 'Bạn cần đăng nhập để chỉnh sửa thông tin.' })
    return
  }

  const name = String(req.body.name || '').trim()
  const age = Number(req.body.age)
  const gender = normalizeGender(req.body.gender)
  const password = String(req.body.password || '')

  if (name.length < 2 || !Number.isInteger(age) || age < 1 || age > 120 || !gender) {
    res.status(400).json({ error: 'Tên, tuổi hoặc giới tính chưa hợp lệ.' })
    return
  }

  if (password && password.length < 6) {
    res.status(400).json({ error: 'Mật khẩu mới cần ít nhất 6 ký tự.' })
    return
  }

  const user = await User.findById(session.userId).select('+passwordHash +passwordSalt name email role age gender ageGroup')

  if (!user) {
    res.status(401).json({ error: 'Phiên đăng nhập không còn hợp lệ.' })
    return
  }

  user.name = name
  user.age = age
  user.gender = gender
  user.ageGroup = getAgeGroup(age)

  if (password) {
    const { hash, salt } = await hashPassword(password)
    user.passwordHash = hash
    user.passwordSalt = salt
  }

  await user.save()

  res.json({
    message: 'Đã cập nhật thông tin cá nhân.',
    user: publicUser(user),
  })
})

router.post('/logout', (req, res) => {
  clearSessionCookie(req, res)
  res.json({ ok: true })
})

export default router
