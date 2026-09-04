import mongoose from 'mongoose'

const authSessionSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  kind: {
    type: String,
    enum: ['session', 'mobile-exchange'],
    default: 'session',
    index: true,
  },
  userAgent: {
    type: String,
    trim: true,
    maxlength: 300,
    default: '',
  },
  ipHash: {
    type: String,
    trim: true,
    default: '',
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
  versionKey: false,
})

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
authSessionSchema.index({ userId: 1, kind: 1, createdAt: -1 })

export const AuthSession = mongoose.model('AuthSession', authSessionSchema)
