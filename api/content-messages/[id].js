import app from '../../backend/app.js'

export default function handler(req, res) {
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const id = encodeURIComponent(String(req.query?.id || ''))
  req.url = `/api/content-messages/${id}${query}`
  return app(req, res)
}
