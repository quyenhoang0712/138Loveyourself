import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Read token from .env.local if not already in process.env
function getToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN
  const envLocalPath = path.join(rootDir, '.env.local')
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8')
    const match = content.match(/BLOB_READ_WRITE_TOKEN=["']?([^"'\r\n]+)["']?/)
    if (match) return match[1]
  }
  return null
}

const token = getToken()
if (!token) {
  console.error('Missing BLOB_READ_WRITE_TOKEN in environment or .env.local')
  process.exit(1)
}

const icons = [
  { file: 'metnhieu.svg', path: 'assets/diary/metnhieu.svg' },
  { file: 'hoichung.svg', path: 'assets/diary/hoichung.svg' },
  { file: 'binhthuong.svg', path: 'assets/diary/binhthuong.svg' },
  { file: 'nhelong.svg', path: 'assets/diary/nhelong.svg' },
  { file: 'ratzui.svg', path: 'assets/diary/ratzui.svg' },
  { file: 'mascottaptrung.svg', path: 'assets/mascot/mascottaptrung.svg' },
]

async function uploadIcon({ file, path: blobPath }) {
  const localFilePath = path.join(rootDir, 'public', file)
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`File not found: ${localFilePath}`)
  }

  const content = fs.readFileSync(localFilePath)
  const url = `https://blob.vercel-storage.com/${blobPath}?addRandomSuffix=false`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      'x-api-version': '7',
      'content-type': 'image/svg+xml',
    },
    body: content,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to upload ${file} (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data
}

async function main() {
  console.log('Uploading icons to Vercel Blob...')
  for (const icon of icons) {
    try {
      const result = await uploadIcon(icon)
      console.log(`✓ ${icon.file} -> ${result.url}`)
    } catch (error) {
      console.error(`✗ ${icon.file}:`, error.message)
    }
  }
}

main()

