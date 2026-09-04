const defaultAssetBaseUrl = 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets'
const assetBaseUrl = String(import.meta.env.VITE_ASSET_BASE_URL || defaultAssetBaseUrl).replace(/\/+$/, '')

export function assetUrl(pathname) {
  const cleanPathname = String(pathname || '').replace(/^\/+/, '')
  return `${assetBaseUrl}/${cleanPathname.split('/').map(encodeURIComponent).join('/')}`
}
