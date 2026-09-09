import { blobAssetMap } from '../config/blobAssetMap'

const defaultAssetBaseUrl = 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets'
const assetBaseUrl = String(import.meta.env.VITE_ASSET_BASE_URL || defaultAssetBaseUrl).replace(/\/+$/, '')

export function assetUrl(pathname) {
  const cleanPathname = String(pathname || '').replace(/^\/+/, '')
  if (blobAssetMap[cleanPathname]) return blobAssetMap[cleanPathname]
  return `${assetBaseUrl}/${cleanPathname.split('/').map(encodeURIComponent).join('/')}`
}
