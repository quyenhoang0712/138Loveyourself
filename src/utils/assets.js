import { blobAssetMap } from '../config/blobAssetMap'

const assetBaseUrl = '/assets'

export function assetUrl(pathname) {
  const cleanPathname = String(pathname || '').replace(/^\/+/, '')
  if (blobAssetMap[cleanPathname]) return blobAssetMap[cleanPathname]
  return `${assetBaseUrl}/${cleanPathname.split('/').map(encodeURIComponent).join('/')}`
}
