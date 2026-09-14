import mongoose from 'mongoose'

const loginEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, enum: ['password', 'google', 'facebook'], required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
}, { versionKey: false })

loginEventSchema.index({ createdAt: -1, provider: 1 })

export const LoginEvent = mongoose.model('LoginEvent', loginEventSchema)
