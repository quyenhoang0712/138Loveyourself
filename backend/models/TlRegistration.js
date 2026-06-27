import mongoose from 'mongoose'

const tlRegistrationSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  authorName: {
    type: String,
    trim: true,
    maxlength: 80,
    required: true,
  },
  dateKey: {
    type: String,
    trim: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
    required: true,
    index: true,
  },
  slot: {
    type: String,
    trim: true,
    maxlength: 40,
    required: true,
    index: true,
  },
  tobacco: {
    type: String,
    enum: ['Lào thủ Việt Nam', 'Chị Huệ'],
    required: true,
  },
  flame: {
    type: String,
    enum: ['Khò', 'Bật thường'],
    required: true,
  },
  lighter: {
    type: String,
    enum: ['Tự châm', 'Khoa', 'Hiếu', 'Quyền', 'Đạt nhỏ', 'Nhân', 'Đạt lớn', 'Đăng'],
    required: true,
  },
  rating: {
    type: String,
    enum: ['Không phê', 'Phê', 'Phê vãi lồn', ''],
    default: '',
  },
  ratingImage: {
    type: String,
    maxlength: 900000,
    default: '',
  },
  ratingImageName: {
    type: String,
    trim: true,
    maxlength: 160,
    default: '',
  },
  ratedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  ratedByName: {
    type: String,
    trim: true,
    maxlength: 80,
    default: '',
  },
  ratedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
  versionKey: false,
})

tlRegistrationSchema.index({ dateKey: 1, createdAt: -1 })
tlRegistrationSchema.index({ createdAt: -1 })
tlRegistrationSchema.index({ authorId: 1, createdAt: -1 })

export const TlRegistration = mongoose.model('TlRegistration', tlRegistrationSchema)
