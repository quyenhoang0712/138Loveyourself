import mongoose from 'mongoose'

let connectionPromise = null

export function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection)
  }

  if (connectionPromise) return connectionPromise

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/love-yourself-analytics'

  connectionPromise = mongoose.connect(mongoUri, {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 0),
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }).catch((error) => {
    connectionPromise = null
    throw error
  })

  return connectionPromise
}
