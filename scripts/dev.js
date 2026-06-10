import { spawn } from 'node:child_process'

const commands = [
  {
    name: 'api',
    command: process.execPath,
    args: ['backend/index.js'],
  },
  {
    name: 'web',
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev:front'],
  },
]

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
