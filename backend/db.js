import mongoose from 'mongoose'

let connectionPromise = null

export function connectDatabase() {
  if (connectionPromise) return connectionPromise

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/love-yourself-analytics'

  connectionPromise = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  })

  return connectionPromise
}
