import app from '../../../backend/app.js'

export default function handler(req, res) {
  req.url = `/api/auth/google/callback${req.url.includes('?') ? `?${req.url.split('?').slice(1).join('?')}` : ''}`
  return app(req, res)
}
