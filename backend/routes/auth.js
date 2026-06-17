import crypto from 'crypto'
import { promisify } from 'util'
import { Router } from 'express'
import { User } from '../models/User.js'
import { getAgeGroup } from '../utils/analytics.js'

const router = Router()
const scrypt = promisify(crypto.scrypt)
const sessionCookieName = 'love_yourself_session'
const sessionDuration = 7 * 24 * 60 * 60 * 1000

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizeGender(gender) {
  return ['male', 'female', 'other'].includes(gender) ? gender : ''
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

export async function getAuthenticatedUser(req) {
  const session = readSession(req)
  return session
    ? User.findById(session.userId).select('name email role age gender ageGroup').lean()
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

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64)
  return { hash: hash.toString('hex'), salt }
}

async function isPasswordValid(password, user) {
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
  }
}

router.post('/register', async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')
  const age = Number(req.body.age)
  const gender = normalizeGender(req.body.gender)

  if (name.length < 2 || !email.includes('@') || password.length < 6 || !Number.isInteger(age) || age < 1 || age > 120 || !gender) {
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
      age,
      gender,
      ageGroup: getAgeGroup(age),
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
