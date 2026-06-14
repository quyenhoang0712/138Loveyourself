import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import net from 'node:net'

const commands = []
const defaultMongoDataPath = process.platform === 'darwin'
  ? '/opt/homebrew/var/mongodb'
  : 'data/mongodb'

function loadEnvFile(filePath = '.env') {
  if (!existsSync(filePath)) return

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) continue

    const separatorIndex = trimmedLine.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim()
    if (key && !process.env[key]) process.env[key] = value
  }
}

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port })

    socket.setTimeout(500)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(false))
  })
}

loadEnvFile()

const mongoUri = process.env.MONGO_URI || ''
const usesLocalMongo = !mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')

if (usesLocalMongo && !(await isPortOpen(27017))) {
  const mongoDataPath = process.env.MONGODB_DB_PATH || defaultMongoDataPath
  if (!existsSync(mongoDataPath)) mkdirSync(mongoDataPath, { recursive: true })

  commands.push({
    name: 'mongodb',
    command: 'mongod',
    args: [
      '--dbpath',
      mongoDataPath,
      '--bind_ip',
      '127.0.0.1',
      '--port',
      '27017',
      '--quiet',
      '--logpath',
      path.join(mongoDataPath, 'mongod.log'),
      '--logappend',
    ],
  })
}

commands.push(
  {
    name: 'api',
    command: process.execPath,
    args: ['--env-file-if-exists=.env', 'backend/index.js'],
  },
  {
    name: 'web',
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev:front'],
  },
)

const children = new Set()
let isShuttingDown = false

function stopAll(signal = 'SIGTERM') {
  if (isShuttingDown) return
  isShuttingDown = true

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal)
    }
  }
}

for (const item of commands) {
  const child = spawn(item.command, item.args, {
    stdio: 'inherit',
    env: process.env,
  })

  children.add(child)

  child.on('exit', (code, signal) => {
    children.delete(child)

    if (!isShuttingDown && code !== 0) {
      console.error(`[dev:${item.name}] exited with ${signal || `code ${code}`}`)
      stopAll()
      process.exitCode = code || 1
    }
  })
}

process.on('SIGINT', () => stopAll('SIGINT'))
process.on('SIGTERM', () => stopAll('SIGTERM'))
