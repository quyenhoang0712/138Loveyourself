import app from '../../backend/app.js'

export default function handler(req, res) {
  if (!req.url.startsWith('/api/analytics') && !req.url.startsWith('/analytics')) {
    req.url = `/api/analytics${req.url.startsWith('/') ? req.url : `/${req.url}`}`
  }

  return app(req, res)
}
