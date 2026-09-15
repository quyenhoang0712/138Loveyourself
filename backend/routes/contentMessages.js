import mongoose from 'mongoose'
import { Router } from 'express'
import { rateLimit } from '../middleware/rateLimit.js'
import { ContentMessage } from '../models/ContentMessage.js'
import { getAuthenticatedUser } from './auth.js'

const router = Router()
const readLimit = rateLimit({ scope: 'content-message-read', limit: 120, windowMs: 60 * 1000 })
const writeLimit = rateLimit({ scope: 'content-message-write', limit: 60, windowMs: 60 * 60 * 1000 })
const allowedTypes = new Set(['quote', 'decisionMessage'])

const serialize = (message) => ({
  id: String(message._id),
  type: message.type,
  text: message.text,
  createdAt: message.createdAt,
})

async function requireAdmin(req, res) {
  const user = await getAuthenticatedUser(req)
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Chỉ admin mới được quản lý nội dung.' })
    return null
  }
  return user
}

router.get('/', readLimit, async (req, res) => {
  const messages = await ContentMessage.find()
    .select('type text createdAt')
    .sort({ createdAt: -1 })
    .lean()

  res.set({
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
  })
  res.json({
    quotes: messages.filter((message) => message.type === 'quote').map(serialize),
    decisionMessages: messages.filter((message) => message.type === 'decisionMessage').map(serialize),
  })
})

router.post('/', writeLimit, async (req, res) => {
  const user = await requireAdmin(req, res)
  if (!user) return

  const type = String(req.body.type || '')
  const text = String(req.body.text || '').trim()
  const maximumLength = type === 'decisionMessage' ? 300 : 600
  if (!allowedTypes.has(type) || !text || text.length > maximumLength) {
    return res.status(400).json({ error: 'Nội dung chưa hợp lệ.' })
  }

  try {
    const message = await ContentMessage.create({ type, text, createdBy: user._id })
    return res.status(201).json({ message: serialize(message) })
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: 'Nội dung này đã tồn tại.' })
    throw error
  }
})

router.delete('/:id', writeLimit, async (req, res) => {
  const user = await requireAdmin(req, res)
  if (!user) return
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Nội dung không hợp lệ.' })

  const message = await ContentMessage.findByIdAndDelete(req.params.id).lean()
  if (!message) return res.status(404).json({ error: 'Không tìm thấy nội dung.' })
  return res.json({ deleted: true })
})

export default router
