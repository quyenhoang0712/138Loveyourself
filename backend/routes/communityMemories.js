import { Router } from 'express'
import { CommunityMemory } from '../models/CommunityMemory.js'
import { getAuthenticatedUser } from './auth.js'

const router = Router()
const serialize = (memory) => ({
  id: String(memory._id), image: memory.image, caption: memory.caption,
  authorName: memory.authorName, createdAt: memory.createdAt,
})

router.get('/', async (req, res) => {
  const memories = await CommunityMemory.find().sort({ createdAt: -1 }).limit(24).lean()
  res.json({ memories: memories.map(serialize) })
})

router.post('/', async (req, res) => {
  const user = await getAuthenticatedUser(req)
  if (!user) return res.status(401).json({ error: 'Bạn đăng nhập để chia sẻ kỷ niệm nha.' })
  const image = typeof req.body.image === 'string' ? req.body.image : ''
  const caption = typeof req.body.caption === 'string' ? req.body.caption.trim() : ''
  if (image.length > 1500000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image) || caption.length > 900) {
    return res.status(400).json({ error: 'Ảnh hoặc lời nhắn chưa hợp lệ.' })
  }
  const bytes = Buffer.from(image.split(',')[1], 'base64')
  if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) {
    return res.status(400).json({ error: 'Ảnh chưa hợp lệ.' })
  }
  const memory = await CommunityMemory.create({ authorId: user._id, authorName: user.name, image, caption })
  res.status(201).json({ memory: serialize(memory) })
})

export default router
