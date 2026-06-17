import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    age: { type: Number, min: 1, max: 120, default: null },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '', index: true },
    ageGroup: { type: String, default: '', index: true },
    passwordHash: { type: String, required: true, select: false },
    passwordSalt: { type: String, required: true, select: false },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
)

export const User = mongoose.model('User', userSchema)
