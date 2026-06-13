import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import net from 'node:net'

const commands = []
const defaultMongoDataPath = process.platform === 'darwin'
  ? '/opt/homebrew/var/mongodb'
  : 'data/mongodb'

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

if (!(await isPortOpen(27017))) {
  const mongoDataPath = process.env.MONGODB_DB_PATH || defaultMongoDataPath
  if (!existsSync(mongoDataPath)) mkdirSync(mongoDataPath, { recursive: true })

  commands.push({
    name: 'mongodb',
    command: 'mongod',
    args: ['--dbpath', mongoDataPath, '--bind_ip', '127.0.0.1', '--port', '27017', '--quiet'],
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
