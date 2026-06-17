import mongoose from 'mongoose'
import { Router } from 'express'
import { CommunityLetter } from '../models/CommunityLetter.js'
import { getAuthenticatedUser } from './auth.js'

const router = Router()
const envelopeColors = new Set(['blue', 'pink', 'green', 'violet'])
const sealColors = new Set(['cream', 'pink', 'mint', 'lavender'])
const stampIds = new Set(['letter-12', 'letter-14'])

function publicLetter(letter) {
  return {
    id: String(letter._id),
    recipient: letter.recipient || 'Cộng đồng',
    title: letter.title,
    body: letter.body,
    authorName: letter.isAnonymous ? '' : letter.authorName,
    isAnonymous: letter.isAnonymous,
    votes: Number(letter.votes || 0),
    envelopeColor: letter.envelopeColor,
    sealColor: letter.sealColor,
    stampId: stampIds.has(letter.stampId) ? letter.stampId : 'letter-12',
    createdAt: letter.createdAt,
    isPublic: true,
  }
}

router.get('/', async (req, res) => {
  const letters = await CommunityLetter.find({
    $or: [
      { recipient: 'Cộng đồng' },
      { recipient: { $exists: false } },
    ],
  })
    .select('recipient title body authorName isAnonymous votes envelopeColor sealColor stampId createdAt')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  res.json({ letters: letters.map(publicLetter) })
})

router.get('/mine', async (req, res) => {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    res.status(401).json({ error: 'Bạn cần đăng nhập để xem thư đã gửi.' })
    return
  }

  const letters = await CommunityLetter.find({ authorId: user._id })
    .select('recipient title body authorName isAnonymous votes envelopeColor sealColor stampId createdAt')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  res.json({ letters: letters.map(publicLetter) })
})

router.post('/', async (req, res) => {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    res.status(401).json({ error: 'Bạn cần đăng nhập để gửi thư.' })
    return
  }

  const title = String(req.body.title || '').trim()
  const body = String(req.body.body || '').trim()
  const recipient = String(req.body.recipient || '').trim() || 'Cộng đồng'
  const isAnonymous = Boolean(req.body.isAnonymous)
  const envelopeColor = envelopeColors.has(req.body.envelopeColor) ? req.body.envelopeColor : 'blue'
  const sealColor = sealColors.has(req.body.sealColor) ? req.body.sealColor : 'cream'
  const stampId = stampIds.has(req.body.stampId) ? req.body.stampId : 'letter-12'

  if (
    recipient.length > 90 ||
    title.length < 2 ||
    title.length > 90 ||
    body.length < 8 ||
    body.length > 900
  ) {
    res.status(400).json({ error: 'Tiêu đề hoặc nội dung lá thư chưa hợp lệ.' })
    return
  }

  const letter = await CommunityLetter.create({
    authorId: user._id,
    authorName: isAnonymous ? '' : user.name,
    recipient,
    title,
    body,
    isAnonymous,
    envelopeColor,
    sealColor,
    stampId,
  })

  res.status(201).json({ letter: publicLetter(letter) })
})

router.delete('/:id', async (req, res) => {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    res.status(401).json({ error: 'Bạn cần đăng nhập để xóa thư.' })
    return
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: 'Không tìm thấy lá thư.' })
    return
  }

  const letter = await CommunityLetter.findOneAndDelete({
    _id: req.params.id,
    authorId: user._id,
  })

  if (!letter) {
    res.status(404).json({ error: 'Không tìm thấy lá thư của bạn.' })
    return
  }

  res.json({ ok: true })
})

export default router
