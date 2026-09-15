import mongoose from 'mongoose'

const visualConfigSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true, index: true },
  draft: { type: mongoose.Schema.Types.Mixed, default: {} },
  published: { type: mongoose.Schema.Types.Mixed, default: {} },
  revisions: {
    type: [{ config: mongoose.Schema.Types.Mixed, publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, publishedAt: Date }],
    default: [],
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false })

export const VisualConfig = mongoose.model('VisualConfig', visualConfigSchema)
