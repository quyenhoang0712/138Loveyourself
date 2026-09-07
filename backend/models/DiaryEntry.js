import mongoose from 'mongoose'

const diaryEntrySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  note: { type: String, required: true, maxlength: 20000 },
  mood: { type: Number, min: 1, max: 5, default: null },
}, { timestamps: true, versionKey: false })
diaryEntrySchema.index({ userId: 1, date: 1 }, { unique: true })
export const DiaryEntry = mongoose.model('DiaryEntry', diaryEntrySchema)
