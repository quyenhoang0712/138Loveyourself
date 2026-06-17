import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    visitorId: { type: String, required: true, index: true },
    userId: { type: String, default: '', index: true },
    startedAt: { type: Date, default: Date.now, index: true },
    lastActiveAt: { type: Date, default: Date.now, index: true },
    endedAt: { type: Date, default: null },
    lastRoom: { type: String, default: 'home', index: true },
    roomDurations: { type: Map, of: Number, default: {} },
    durationSeconds: { type: Number, default: 0 },
    userAgent: { type: String, default: '' },
    referrer: { type: String, default: '' },
  },
  { versionKey: false },
)

sessionSchema.index({ startedAt: -1 })
sessionSchema.index({ userId: 1, startedAt: -1 })
sessionSchema.index({ visitorId: 1, startedAt: -1 })
sessionSchema.index({ lastActiveAt: -1 })

export const Session = mongoose.model('Session', sessionSchema)
