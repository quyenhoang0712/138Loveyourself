import { Router } from 'express'
import { Feedback } from '../models/Feedback.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()
const submitLimit = rateLimit({ scope: 'feedback-submit', limit: 5, windowMs: 60 * 60 * 1000 })

function normalizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizeEmail(value) {
  return normalizeText(value, 160).toLowerCase()
}

router.post('/', submitLimit, async (req, res) => {
  const name = normalizeText(req.body.name, 80)
  const email = normalizeEmail(req.body.email)
  const message = normalizeText(req.body.message, 1200)
  const visitorId = normalizeText(req.body.visitorId, 120)
  const sessionId = normalizeText(req.body.sessionId, 120)

  if (message.length < 6) {
    res.status(400).json({ error: 'Bạn viết góp ý dài hơn một chút nha.' })
    return
  }

  if (email && !email.includes('@')) {
    res.status(400).json({ error: 'Email chưa hợp lệ.' })
    return
  }

  await Feedback.create({
    name,
    email,
    message,
    visitorId,
    sessionId,
    userAgent: String(req.get('user-agent') || '').slice(0, 300),
  })

  res.status(201).json({ message: 'Cảm ơn bạn đã góp ý. Tụi mình nhận được rồi!' })
})

export default router
