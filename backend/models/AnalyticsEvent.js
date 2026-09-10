import mongoose from 'mongoose'

const analyticsEventSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, default: '', index: true },
    type: { type: String, required: true, index: true },
    room: { type: String, default: 'home', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 180 * 86400000) },
  },
  { versionKey: false },
)

analyticsEventSchema.index({ createdAt: -1, type: 1 })
analyticsEventSchema.index({ userId: 1, createdAt: -1 })
analyticsEventSchema.index({ visitorId: 1, createdAt: -1 })
analyticsEventSchema.index({ sessionId: 1, createdAt: -1 })
analyticsEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema)
