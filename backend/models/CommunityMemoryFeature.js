import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  dateKey: { type: String, required: true, unique: true, index: true },
  images: {
    type: [String],
    validate: [(images) => images.length <= 2, 'Chỉ có tối đa 2 ảnh nổi bật.'],
    default: [],
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
}, { timestamps: true })

export const CommunityMemoryFeature = mongoose.model('CommunityMemoryFeature', schema)
