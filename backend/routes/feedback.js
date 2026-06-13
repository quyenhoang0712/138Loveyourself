import { Router } from 'express'
import { Feedback } from '../models/Feedback.js'

const router = Router()

function normalizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizeEmail(value) {
  return normalizeText(value, 160).toLowerCase()
}

router.post('/', async (req, res) => {
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
    userAgent: req.get('user-agent') || '',
  })

  res.status(201).json({ message: 'Cảm ơn bạn đã góp ý. Tụi mình nhận được rồi!' })
})

export default router
