import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    age: { type: Number, min: 1, max: 120, default: null },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '', index: true },
    ageGroup: { type: String, default: '', index: true },
    authProvider: { type: String, enum: ['password', 'google', 'facebook'], default: 'password', index: true },
    googleId: { type: String, trim: true, sparse: true, unique: true },
    facebookId: { type: String, trim: true, sparse: true, unique: true },
    emailVerifiedAt: { type: Date, default: null },
    returnStreak: {
      currentStreak: { type: Number, min: 0, default: 0 },
      lastVisitDate: { type: String, default: '' },
      visitedDates: { type: [String], default: [] },
    },
    passwordHash: { type: String, default: '', select: false },
    passwordSalt: { type: String, default: '', select: false },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
)

export const User = mongoose.model('User', userSchema)
