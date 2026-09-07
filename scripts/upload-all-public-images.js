import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

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
  console.error('Missing BLOB_READ_WRITE_TOKEN in .env.local')
  process.exit(1)
}

const publicDir = path.join(rootDir, 'public')
const files = fs.readdirSync(publicDir)
const imageExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico']
const imageFiles = files.filter((file) => {
  const ext = path.extname(file).toLowerCase()
  return imageExtensions.includes(ext)
})

console.log(`Tìm thấy ${imageFiles.length} file ảnh trong thư mục public:`, imageFiles)

async function uploadFile(fileName) {
  const filePath = path.join(publicDir, fileName)
  const content = fs.readFileSync(filePath)
  const ext = path.extname(fileName).toLowerCase()
  const mimeType = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'application/octet-stream'
  
  const blobPathname = `assets/public/${fileName}`
  const url = `https://blob.vercel-storage.com/${blobPathname}?addRandomSuffix=false`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      'x-api-version': '7',
      'content-type': mimeType,
    },
    body: content,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Lỗi tải lên ${fileName} (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data.url
}

async function run() {
  const uploadedUrls = {}
  for (const file of imageFiles) {
    try {
      const url = await uploadFile(file)
      uploadedUrls[file] = url
      console.log(`✓ Đã tải lên Blob: ${file} -> ${url}`)
      
      // Xóa file ảnh trong public sau khi tải lên thành công
      fs.unlinkSync(path.join(publicDir, file))
      console.log(`🗑️ Đã xóa file cục bộ: public/${file}`)
    } catch (err) {
      console.error(`✗ Lỗi với ${file}:`, err.message)
    }
  }

  // Lưu lại danh sách map URL để cập nhật code
  const mapPath = path.join(rootDir, 'scripts', 'uploaded-blob-map.json')
  fs.writeFileSync(mapPath, JSON.stringify(uploadedUrls, null, 2), 'utf8')
  console.log(`\nHoàn thành! Đã lưu ánh xạ URL vào: ${mapPath}`)
}

run()

