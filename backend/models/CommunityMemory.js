import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, maxlength: 80, default: '' },
  image: { type: String, required: true },
  originalImage: { type: String, default: '' },
  caption: { type: String, trim: true, maxlength: 900, default: '' },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
}, { timestamps: true })

export const CommunityMemory = mongoose.model('CommunityMemory', schema)
