import { Router } from 'express'
import { CommunityMemory } from '../models/CommunityMemory.js'
import { CommunityMemoryFeature } from '../models/CommunityMemoryFeature.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { getAuthenticatedUser } from './auth.js'

const router = Router()
const vietnamOffset = 7 * 60 * 60 * 1000
const readLimit = rateLimit({ scope: 'memory-read', limit: 90, windowMs: 60 * 1000 })
const publishLimit = rateLimit({ scope: 'memory-publish', limit: 8, windowMs: 60 * 60 * 1000 })

function getVietnamDayRange(date = new Date()) {
  const localDate = new Date(date.getTime() + vietnamOffset)
  const startTime = Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate()) - vietnamOffset
  return {
    start: new Date(startTime),
    end: new Date(startTime + 24 * 60 * 60 * 1000),
  }
}

function formatVietnamDate(date = new Date()) {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date)
}

function getVietnamDateKey(date = new Date()) {
  const localDate = new Date(date.getTime() + vietnamOffset)
  return [localDate.getUTCFullYear(), String(localDate.getUTCMonth() + 1).padStart(2, '0'), String(localDate.getUTCDate()).padStart(2, '0')].join('-')
}

function normalizeDateKey(value) {
  const dateKey = String(value || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return ''
  const parsed = new Date(`${dateKey}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dateKey ? '' : dateKey
}

function validateImage(image) {
  const jpegPattern = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/
  if (image.length > 300000 || !jpegPattern.test(image)) return false
  const bytes = Buffer.from(image.split(',')[1], 'base64')
  return bytes.length <= 225000 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
}

const serialize = (memory) => ({
  id: String(memory._id), image: memory.image, caption: memory.caption,
  authorName: memory.authorName, createdAt: memory.createdAt,
})

router.get('/', readLimit, async (req, res) => {
  const { start, end } = getVietnamDayRange()
  const requestedDate = normalizeDateKey(req.query.date)
  const user = requestedDate ? await getAuthenticatedUser(req) : null
  if (req.query.date && (!requestedDate || user?.role !== 'admin')) return res.status(403).json({ error: 'Chỉ admin mới xem được ảnh theo ngày.' })
  const dateKey = requestedDate || getVietnamDateKey()
  const [memories, feature] = await Promise.all([
    CommunityMemory.find({ createdAt: { $gte: start, $lt: end }, expiresAt: { $gt: new Date() } })
    .select('image caption authorName createdAt')
    .sort({ createdAt: -1 })
    .limit(12)
    .lean(),
    CommunityMemoryFeature.findOne({ dateKey }).select('images').lean(),
  ])
  res.set({
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
  })
  res.json({ memories: memories.map(serialize), featuredImages: feature?.images || [], dateLabel: requestedDate ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${requestedDate}T12:00:00Z`)) : formatVietnamDate() })
})

router.put('/featured/:slot', publishLimit, async (req, res) => {
  const user = await getAuthenticatedUser(req)
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Chỉ admin mới được thay hai ảnh nổi bật.' })
  const slot = Number(req.params.slot)
  const dateKey = normalizeDateKey(req.body.date) || getVietnamDateKey()
  const image = typeof req.body.image === 'string' ? req.body.image : ''
  if (![0, 1].includes(slot) || !validateImage(image)) return res.status(400).json({ error: 'Ảnh nổi bật chưa hợp lệ.' })

  const existing = await CommunityMemoryFeature.findOne({ dateKey }).lean()
  const images = existing?.images ? [...existing.images] : []
  images[slot] = image
  const archiveExpiry = new Date(`${dateKey}T00:00:00.000Z`)
  archiveExpiry.setUTCFullYear(archiveExpiry.getUTCFullYear() + 10)
  const feature = await CommunityMemoryFeature.findOneAndUpdate(
    { dateKey },
    { $set: { images, updatedBy: user._id, expiresAt: archiveExpiry } },
    { new: true, upsert: true, runValidators: true },
  )
  res.json({ featuredImages: feature.images })
})

router.post('/', publishLimit, async (req, res) => {
  const user = await getAuthenticatedUser(req)
  if (!user) return res.status(401).json({ error: 'Bạn đăng nhập để chia sẻ kỷ niệm nha.' })
  const image = typeof req.body.image === 'string' ? req.body.image : ''
  const caption = typeof req.body.caption === 'string' ? req.body.caption.trim() : ''
  if (!validateImage(image) || caption.length > 900) {
    return res.status(400).json({ error: 'Ảnh hoặc lời nhắn chưa hợp lệ.' })
  }
  const { end } = getVietnamDayRange()
  const memory = await CommunityMemory.create({ authorId: user._id, authorName: user.name, image, caption, expiresAt: end })
  res.status(201).json({ memory: serialize(memory) })
})

export default router
