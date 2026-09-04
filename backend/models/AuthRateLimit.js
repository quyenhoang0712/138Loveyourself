import mongoose from 'mongoose'

const authRateLimitSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  scope: {
    type: String,
    required: true,
    index: true,
  },
  count: {
    type: Number,
    min: 0,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
  versionKey: false,
})

authRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const AuthRateLimit = mongoose.model('AuthRateLimit', authRateLimitSchema)
