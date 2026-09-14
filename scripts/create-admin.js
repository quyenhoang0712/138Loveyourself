import crypto from 'crypto'
import { promisify } from 'util'
import { connectDatabase } from '../backend/db.js'
import { User } from '../backend/models/User.js'

const scrypt = promisify(crypto.scrypt)
const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const password = String(process.env.ADMIN_PASSWORD || '')
const name = String(process.env.ADMIN_NAME || 'LOVE YOURSELF Admin').trim()

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 15 || password.length > 128) {
  console.error('Cần ADMIN_EMAIL hợp lệ và ADMIN_PASSWORD từ 15 đến 128 ký tự.')
  process.exit(1)
}

await connectDatabase()
const salt = crypto.randomBytes(16).toString('hex')
const passwordHash = (await scrypt(password, salt, 64)).toString('hex')
const user = await User.findOneAndUpdate(
  { email },
  {
    $set: {
      name,
      role: 'admin',
      authProvider: 'password',
      emailVerifiedAt: new Date(),
      passwordHash,
      passwordSalt: salt,
    },
  },
  { upsert: true, returnDocument: 'after', runValidators: true },
)

console.log(`Đã sẵn sàng tài khoản admin: ${user.email}`)
process.exit(0)
