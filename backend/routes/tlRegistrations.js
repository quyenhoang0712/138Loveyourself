import mongoose from 'mongoose'
import crypto from 'crypto'
import { Router } from 'express'
import { TlRegistration } from '../models/TlRegistration.js'
import { getAuthenticatedUser } from './auth.js'

const router = Router()
const slots = new Set([
  '06:00 - 08:00',
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00',
  '22:00 - 00:00',
  '00:00 - 02:00',
])
const tobaccos = new Set(['Lào thủ Việt Nam', 'Chị Huệ'])
const flames = new Set(['Khò', 'Bật thường'])
const lighters = new Set(['Tự châm', 'Khoa', 'Hiếu', 'Quyền', 'Đạt nhỏ', 'Nhân', 'Đạt lớn', 'Đăng'])
const ratings = new Set(['Không phê', 'Phê', 'Phê vãi lồn'])

function publicRegistration(registration) {
  return {
    id: String(registration._id),
    authorName: registration.authorName,
    dateKey: registration.dateKey || getDateKeyFromDate(registration.createdAt),
    slot: registration.slot,
    tobacco: registration.tobacco,
    flame: registration.flame,
    lighter: registration.lighter,
    rating: registration.rating || '',
    ratingImage: registration.ratingImage || '',
    ratingImageName: registration.ratingImageName || '',
    ratedByName: registration.ratedByName || '',
    ratedAt: registration.ratedAt || null,
    submittedAt: registration.createdAt,
  }
}

function getTodayKey() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(new Date()).reduce((value, part) => ({
    ...value,
    [part.type]: part.value,
  }), {})

  return `${parts.year}-${parts.month}-${parts.day}`
}

function normalizeDateKey(dateKey) {
  const value = String(dateKey || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : getTodayKey()
}

function getDateKeyFromDate(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date || new Date()).reduce((value, part) => ({
    ...value,
    [part.type]: part.value,
  }), {})

  return `${parts.year}-${parts.month}-${parts.day}`
}

function getUtcRangeFromDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0))
  const end = new Date(Date.UTC(year, month - 1, day + 1, -7, 0, 0, 0))

  return { start, end }
}

function createCloudinarySignature(params, apiSecret) {
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return crypto.createHash('sha1').update(`${signatureBase}${apiSecret}`).digest('hex')
}

function getCloudinaryConfig() {
  if (!process.env.CLOUDINARY_URL) {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    }
  }

  try {
    const url = new URL(process.env.CLOUDINARY_URL)

    return {
      cloudName: url.hostname,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      apiKey: decodeURIComponent(url.username || ''),
      apiSecret: decodeURIComponent(url.password || ''),
    }
  } catch {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    }
  }
}

async function uploadRatingImageToCloudinary(ratingImage) {
  if (!ratingImage || ratingImage.startsWith('http://') || ratingImage.startsWith('https://')) {
    return ratingImage
  }

  const { cloudName, uploadPreset, apiKey, apiSecret } = getCloudinaryConfig()

  if (!cloudName || (!uploadPreset && (!apiKey || !apiSecret))) {
    return ratingImage
  }

  const formData = new FormData()
  formData.append('file', ratingImage)

  if (uploadPreset) {
    formData.append('upload_preset', uploadPreset)
  } else {
    const timestamp = Math.round(Date.now() / 1000)
    const signatureParams = {
      folder: 'tl-registrations',
      timestamp,
    }

    formData.append('api_key', apiKey)
    formData.append('folder', signatureParams.folder)
    formData.append('timestamp', String(timestamp))
    formData.append('signature', createCloudinarySignature(signatureParams, apiSecret))
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error?.message || 'Chưa upload được ảnh lên Cloudinary.')
  }

  return data.secure_url || data.url || ratingImage
}

router.get('/', async (req, res) => {
  const dateKey = normalizeDateKey(req.query.date)
  const { start, end } = getUtcRangeFromDateKey(dateKey)
  const registrations = await TlRegistration.find({
    $or: [
      { dateKey },
      {
        dateKey: { $exists: false },
        createdAt: { $gte: start, $lt: end },
      },
    ],
  })
    .select('authorName dateKey slot tobacco flame lighter rating ratingImage ratingImageName ratedByName ratedAt createdAt')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  res.json({ dateKey, registrations: registrations.map(publicRegistration) })
})

router.post('/', async (req, res) => {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    res.status(401).json({ error: 'Bạn cần đăng nhập để đăng ký.' })
    return
  }

  const slot = String(req.body.slot || '').trim()
  const tobacco = String(req.body.tobacco || '').trim()
  const flame = String(req.body.flame || '').trim()
  const lighter = String(req.body.lighter || '').trim()
  const dateKey = normalizeDateKey(req.body.dateKey)

  if (!slots.has(slot) || !tobaccos.has(tobacco) || !flames.has(flame) || !lighters.has(lighter)) {
    res.status(400).json({ error: 'Thông tin đăng ký chưa hợp lệ.' })
    return
  }

  const registration = await TlRegistration.create({
    authorId: user._id,
    authorName: user.name,
    dateKey,
    slot,
    tobacco,
    flame,
    lighter,
  })

  res.status(201).json({ registration: publicRegistration(registration) })
})

router.patch('/:id/rating', async (req, res) => {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    res.status(401).json({ error: 'Bạn cần đăng nhập để đánh giá.' })
    return
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: 'Không tìm thấy đăng ký.' })
    return
  }

  const rating = String(req.body.rating || '').trim()
  const ratingImage = String(req.body.ratingImage || '').trim()
  const ratingImageName = String(req.body.ratingImageName || '').trim()

  if (!ratings.has(rating)) {
    res.status(400).json({ error: 'Đánh giá chưa hợp lệ.' })
    return
  }

  if (
    ratingImage
    && !ratingImage.startsWith('data:image/')
    && !ratingImage.startsWith('http://')
    && !ratingImage.startsWith('https://')
  ) {
    res.status(400).json({ error: 'Ảnh đánh giá chưa hợp lệ.' })
    return
  }

  if (ratingImage.startsWith('data:image/') && ratingImage.length > 900000) {
    res.status(400).json({ error: 'Ảnh đánh giá hơi nặng, bạn chọn ảnh nhỏ hơn nha.' })
    return
  }

  let storedRatingImage
  try {
    storedRatingImage = await uploadRatingImageToCloudinary(ratingImage)
  } catch (error) {
    res.status(502).json({ error: error.message })
    return
  }

  const registration = await TlRegistration.findByIdAndUpdate(
    req.params.id,
    {
      rating,
      ratingImage: storedRatingImage,
      ratingImageName,
      ratedById: user._id,
      ratedByName: user.name,
      ratedAt: new Date(),
    },
    { new: true },
  )

  if (!registration) {
    res.status(404).json({ error: 'Không tìm thấy đăng ký.' })
    return
  }

  res.json({ registration: publicRegistration(registration) })
})

export default router
