import mongoose from 'mongoose'
import { Router } from 'express'
import { rateLimit } from '../middleware/rateLimit.js'
import { ContentMessage } from '../models/ContentMessage.js'
import { getAuthenticatedUser } from './auth.js'
import { quotes as defaultQuotes } from '../../src/quotes.js'
import { decisionMessages as defaultDecisionMessages } from '../../src/decisionMessages.js'

const router = Router()
const readLimit = rateLimit({ scope: 'content-message-read', limit: 120, windowMs: 60 * 1000 })
const writeLimit = rateLimit({ scope: 'content-message-write', limit: 60, windowMs: 60 * 60 * 1000 })
const allowedTypes = new Set(['quote', 'decisionMessage'])
const defaultMessages = {
  quote: defaultQuotes.map((text, index) => ({ id: `default-quote-${index}`, type: 'quote', text, source: 'default' })),
  decisionMessage: defaultDecisionMessages.map((text, index) => ({ id: `default-decisionMessage-${index}`, type: 'decisionMessage', text, source: 'default' })),
}

const serialize = (message) => ({
  id: String(message._id),
  type: message.type,
  text: message.text,
  source: message.source || 'custom',
  createdAt: message.createdAt,
})

function findDefaultMessage(id) {
  return [...defaultMessages.quote, ...defaultMessages.decisionMessage].find((message) => message.id === id)
}

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
    .select('type text source isDeleted createdAt')
    .sort({ createdAt: -1 })
    .lean()

  const deletedDefaults = new Set(messages
    .filter((message) => message.source === 'default' && message.isDeleted)
    .map((message) => `${message.type}:${message.text}`))
  const activeCustomMessages = messages.filter((message) => message.source !== 'default' && !message.isDeleted)
  const activeDefaults = Object.fromEntries(Object.entries(defaultMessages).map(([type, items]) => [
    type,
    items.filter((message) => !deletedDefaults.has(`${message.type}:${message.text}`)),
  ]))

  res.set({
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
  })
  res.json({
    quotes: [...activeDefaults.quote, ...activeCustomMessages.filter((message) => message.type === 'quote').map(serialize)],
    decisionMessages: [...activeDefaults.decisionMessage, ...activeCustomMessages.filter((message) => message.type === 'decisionMessage').map(serialize)],
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
    const existing = await ContentMessage.findOne({ type, text })
    if (existing?.isDeleted) {
      existing.source = 'custom'
      existing.isDeleted = false
      existing.createdBy = user._id
      await existing.save()
      return res.status(201).json({ message: serialize(existing) })
    }
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
  const defaultMessage = findDefaultMessage(req.params.id)
  if (defaultMessage) {
    await ContentMessage.findOneAndUpdate(
      { type: defaultMessage.type, text: defaultMessage.text },
      { $set: { source: 'default', isDeleted: true, createdBy: user._id } },
      { upsert: true, runValidators: true },
    )
    return res.json({ deleted: true })
  }
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Nội dung không hợp lệ.' })

  const message = await ContentMessage.findByIdAndDelete(req.params.id).lean()
  if (!message) return res.status(404).json({ error: 'Không tìm thấy nội dung.' })
  return res.json({ deleted: true })
})

export default router
