import mongoose from 'mongoose'

const visitorSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, unique: true, index: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true, index: true },
    ageGroup: { type: String, required: true, index: true },
    firstSeenAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
)

export const Visitor = mongoose.model('Visitor', visitorSchema)
