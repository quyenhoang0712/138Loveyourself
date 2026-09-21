import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib'

const CACHE_MAGIC = 0xfcfb6d1ba7725c30n
const EOF_MAGIC = Buffer.from([0xd8, 0x41, 0x0d, 0x97, 0x45, 0x6f, 0xfa, 0xf4])
const BLOB_HOST = 'dccpjtvtpue8ic8d.public.blob.vercel-storage.com'
const defaultCacheDir = path.join(
  process.env.HOME,
  'Library/Caches/Google/Chrome/Profile 1/Cache/Cache_Data',
)

function getHeaderValue(headers, name) {
  const match = headers.match(new RegExp(`${name}:\\s*([^\\0\\r\\n]+)`, 'i'))
  return match?.[1]?.trim() || ''
}

function decodeBody(body, encoding) {
  if (encoding === 'br') return brotliDecompressSync(body)
  if (encoding === 'gzip') return gunzipSync(body)
  if (encoding === 'deflate') return inflateSync(body)
  return body
}

function detectAssetKind(body) {
  if (body.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'png'
  if (/^GIF8[79]a$/.test(body.subarray(0, 6).toString('ascii'))) return 'gif'
  if (body.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))) return 'jpeg'
  if (body.subarray(0, 4).equals(Buffer.from('00000100', 'hex'))) return 'ico'
  if (body.subarray(0, 4).toString('ascii') === 'RIFF') return 'riff'
  if (body.subarray(4, 8).toString('ascii') === 'ftyp') return 'mp4'
  if (body.subarray(0, 4).toString('ascii') === 'OggS') return 'ogg'
  if (body.subarray(0, 3).toString('ascii') === 'ID3') return 'mp3'
  if (body[0] === 0xff && (body[1] & 0xe0) === 0xe0) return 'mp3'

  const textStart = body.subarray(0, 512).toString('utf8').trimStart()
  if (textStart.startsWith('<svg') || textStart.startsWith('<?xml')) return 'svg'
  return ''
}

function parseEntry(data) {
  if (data.length < 48 || data.readBigUInt64LE(0) !== CACHE_MAGIC) return null

  const keyLength = data.readUInt32LE(12)
  const keyStart = 24
  const bodyStart = keyStart + keyLength
  if (bodyStart + 24 >= data.length) return null

  const key = data.subarray(keyStart, bodyStart).toString('utf8').replace(/\0+$/, '')
  const url = key.split(/\s+/).at(-1)
  if (!url) return null

  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch {
    return null
  }
  if (parsedUrl.hostname !== BLOB_HOST) return null

  const firstEof = data.indexOf(EOF_MAGIC, bodyStart)
  if (firstEof < 0) return null

  const headersStart = firstEof + 20
  const finalEof = data.lastIndexOf(EOF_MAGIC)
  if (finalEof <= headersStart) return null

  const headers = data.subarray(headersStart, finalEof).toString('latin1')
  const encoding = getHeaderValue(headers, 'content-encoding').toLowerCase()
  const contentType = getHeaderValue(headers, 'content-type').toLowerCase()
  const storedBody = data.subarray(bodyStart, firstEof)
  const body = decodeBody(storedBody, encoding)
  const kind = detectAssetKind(body)
  if (!kind) return null

  return {
    body,
    contentType,
    encoding,
    kind,
    url,
  }
}

function safeRelativePath(url) {
  const pathname = decodeURIComponent(new URL(url).pathname).replace(/^\/assets\//, '')
  return pathname
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/')
}

async function main() {
  const cacheDir = process.argv[2] || defaultCacheDir
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputDir = path.resolve(`recovered-blob-cache-${timestamp}`)
  const entries = await fs.readdir(cacheDir)
  const recovered = new Map()
  const failures = []

  for (const filename of entries.filter((name) => name.endsWith('_0'))) {
    const source = path.join(cacheDir, filename)
    try {
      const parsed = parseEntry(await fs.readFile(source))
      if (!parsed?.body.length) continue

      const previous = recovered.get(parsed.url)
      if (!previous || parsed.body.length > previous.body.length) {
        recovered.set(parsed.url, { ...parsed, source })
      }
    } catch (error) {
      failures.push({ source, error: String(error) })
    }
  }

  await fs.mkdir(outputDir, { recursive: true })
  const manifest = []

  for (const item of recovered.values()) {
    const relativePath = safeRelativePath(item.url)
    const target = path.join(outputDir, 'assets', relativePath)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, item.body, { flag: 'wx' })
    manifest.push({
      url: item.url,
      file: path.relative(outputDir, target),
      bytes: item.body.length,
      contentType: item.contentType,
      encoding: item.encoding || 'identity',
      kind: item.kind,
      cacheEntry: path.basename(item.source),
    })
  }

  await fs.writeFile(
    path.join(outputDir, 'manifest.json'),
    `${JSON.stringify({ recovered: manifest, failures }, null, 2)}\n`,
    { flag: 'wx' },
  )

  console.log(JSON.stringify({ outputDir, recovered: manifest.length, failures: failures.length }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
