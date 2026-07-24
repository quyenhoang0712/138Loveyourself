import app from '../../../backend/app.js'

export default function handler(req, res) {
  req.url = `/api/auth/google/start${req.url.includes('?') ? `?${req.url.split('?').slice(1).join('?')}` : ''}`
  return app(req, res)
}
