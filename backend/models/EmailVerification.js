import mongoose from 'mongoose'

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  passwordSalt: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    min: 1,
    max: 120,
    default: null,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: '',
  },
  ageGroup: {
    type: String,
    default: '',
  },
  returnTo: {
    type: String,
    default: '/',
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
  versionKey: false,
})

emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema)
