import { Router } from 'express'
import { CommunityMemory } from '../models/CommunityMemory.js'
import { getAuthenticatedUser } from './auth.js'

const router = Router()
const vietnamOffset = 7 * 60 * 60 * 1000

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

const serialize = (memory) => ({
  id: String(memory._id), image: memory.image, originalImage: memory.originalImage || memory.image, caption: memory.caption,
  authorName: memory.authorName, createdAt: memory.createdAt,
})

router.get('/', async (req, res) => {
  const { start, end } = getVietnamDayRange()
  const [, memories] = await Promise.all([
    CommunityMemory.deleteMany({ createdAt: { $lt: start } }),
    CommunityMemory.find({ createdAt: { $gte: start, $lt: end } }).sort({ createdAt: -1 }).limit(24).lean(),
  ])
  res.json({ memories: memories.map(serialize), dateLabel: formatVietnamDate() })
})

router.post('/', async (req, res) => {
  const user = await getAuthenticatedUser(req)
  if (!user) return res.status(401).json({ error: 'Bạn đăng nhập để chia sẻ kỷ niệm nha.' })
  const image = typeof req.body.image === 'string' ? req.body.image : ''
  const originalImage = typeof req.body.originalImage === 'string' ? req.body.originalImage : ''
  const caption = typeof req.body.caption === 'string' ? req.body.caption.trim() : ''
  const jpegPattern = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/
  if (image.length > 700000 || originalImage.length > 700000 || !jpegPattern.test(image) || !jpegPattern.test(originalImage) || caption.length > 900) {
    return res.status(400).json({ error: 'Ảnh hoặc lời nhắn chưa hợp lệ.' })
  }
  const bytes = Buffer.from(image.split(',')[1], 'base64')
  const originalBytes = Buffer.from(originalImage.split(',')[1], 'base64')
  if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255 || originalBytes[0] !== 255 || originalBytes[1] !== 216 || originalBytes[2] !== 255) {
    return res.status(400).json({ error: 'Ảnh chưa hợp lệ.' })
  }
  const { end } = getVietnamDayRange()
  const memory = await CommunityMemory.create({ authorId: user._id, authorName: user.name, image, originalImage, caption, expiresAt: end })
  res.status(201).json({ memory: serialize(memory) })
})

export default router
