import crypto from 'crypto'
import { AuthRateLimit } from '../models/AuthRateLimit.js'

function hash(value) {
  const secret = process.env.AUTH_SESSION_SECRET || 'development-only-change-me'
  return crypto.createHmac('sha256', secret).update(String(value || '')).digest('hex')
}

export function rateLimit({ scope, limit, windowMs, key = () => '' }) {
  return async function applyRateLimit(req, res, next) {
    const now = Date.now()
    const bucket = Math.floor(now / windowMs)
    const client = hash(req.ip || req.socket?.remoteAddress || 'unknown')
    const identity = String(key(req) || '').slice(0, 160)
    const documentKey = hash(`${scope}:${client}:${identity}:${bucket}`)
    const expiresAt = new Date((bucket + 2) * windowMs)
    let entry

    try {
      entry = await AuthRateLimit.findOneAndUpdate(
        { key: documentKey },
        { $inc: { count: 1 }, $setOnInsert: { scope, expiresAt } },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: false },
      ).lean()
    } catch (error) {
      if (error?.code !== 11000) throw error
      entry = await AuthRateLimit.findOneAndUpdate(
        { key: documentKey },
        { $inc: { count: 1 } },
        { returnDocument: 'after' },
      ).lean()
    }

    const count = Number(entry?.count || 0)
    const resetAt = (bucket + 1) * windowMs
    res.set('RateLimit-Limit', String(limit))
    res.set('RateLimit-Remaining', String(Math.max(0, limit - count)))
    res.set('RateLimit-Reset', String(Math.ceil(resetAt / 1000)))

    if (count <= limit) return next()

    res.set('Retry-After', String(Math.max(1, Math.ceil((resetAt - now) / 1000))))
    return res.status(429).json({ error: 'Bạn thao tác hơi nhanh. Chờ một chút rồi thử lại nha.' })
  }
}
