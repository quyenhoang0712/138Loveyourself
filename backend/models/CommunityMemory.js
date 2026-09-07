import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, maxlength: 80, default: '' },
  image: { type: String, required: true },
  caption: { type: String, trim: true, maxlength: 900, default: '' },
}, { timestamps: true })

export const CommunityMemory = mongoose.model('CommunityMemory', schema)
