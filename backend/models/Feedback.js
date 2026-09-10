import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 80, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 160, default: '' },
    message: { type: String, trim: true, minlength: 6, maxlength: 1200, required: true },
    visitorId: { type: String, trim: true, default: '', index: true },
    sessionId: { type: String, trim: true, default: '', index: true },
    userAgent: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 365 * 86400000) },
  },
  { versionKey: false },
)

feedbackSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const Feedback = mongoose.model('Feedback', feedbackSchema)
