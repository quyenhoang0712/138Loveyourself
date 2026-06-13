import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
)

export const User = mongoose.model('User', userSchema)
