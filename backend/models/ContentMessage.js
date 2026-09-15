import mongoose from 'mongoose'

const contentMessageSchema = new mongoose.Schema({
  type: { type: String, enum: ['quote', 'decisionMessage'], required: true, index: true },
  text: { type: String, trim: true, required: true, maxlength: 600 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

contentMessageSchema.index({ type: 1, text: 1 }, { unique: true })

export const ContentMessage = mongoose.model('ContentMessage', contentMessageSchema)
