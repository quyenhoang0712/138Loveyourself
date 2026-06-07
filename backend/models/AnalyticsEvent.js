import mongoose from 'mongoose'

const analyticsEventSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    room: { type: String, default: 'home', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
)

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema)
