import crypto from 'crypto'
import { promisify } from 'util'
import { Router } from 'express'
import { User } from '../models/User.js'

const router = Router()
const scrypt = promisify(crypto.scrypt)
const sessionCookieName = 'love_yourself_session'
const sessionDuration = 7 * 24 * 60 * 60 * 1000

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
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

function setSessionCookie(req, res, userId) {
  const isSecure = process.env.NODE_ENV === 'production' || req.get('x-forwarded-proto') === 'https'
  res.cookie(sessionCookieName, createSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    maxAge: sessionDuration,
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
  }
}

router.post('/register', async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')

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
  const user = await User.findOne({ email })

  if (!user || !(await isPasswordValid(password, user))) {
    res.status(401).json({ error: 'Email hoặc mật khẩu chưa đúng.' })
    return
  }

  user.lastLoginAt = new Date()
  await user.save()
  setSessionCookie(req, res, String(user._id))
  res.json({ message: 'Đăng nhập thành công!', user: publicUser(user) })
})

router.get('/me', async (req, res) => {
  const session = readSession(req)
  if (!session) {
    res.json({ user: null })
    return
  }

  const user = await User.findById(session.userId)
  res.json({ user: user ? publicUser(user) : null })
})

router.post('/logout', (req, res) => {
  res.clearCookie(sessionCookieName, { path: '/' })
  res.json({ ok: true })
})

export default router
