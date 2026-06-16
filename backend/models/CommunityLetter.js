import mongoose from 'mongoose'

const communityLetterSchema = new mongoose.Schema({
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
    default: '',
  },
  recipient: {
    type: String,
    trim: true,
    maxlength: 90,
    default: 'Cộng đồng',
  },
  title: {
    type: String,
    trim: true,
    minlength: 2,
    maxlength: 90,
    required: true,
  },
  body: {
    type: String,
    trim: true,
    minlength: 8,
    maxlength: 900,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  envelopeColor: {
    type: String,
    enum: ['blue', 'pink', 'green', 'violet'],
    default: 'blue',
  },
  sealColor: {
    type: String,
    enum: ['cream', 'pink', 'mint', 'lavender'],
    default: 'cream',
  },
  stampId: {
    type: String,
    enum: ['letter-12', 'letter-14'],
    default: 'letter-12',
  },
  votes: {
    type: Number,
    min: 0,
    default: 0,
  },
}, {
  timestamps: true,
  versionKey: false,
})

export const CommunityLetter = mongoose.model('CommunityLetter', communityLetterSchema)
