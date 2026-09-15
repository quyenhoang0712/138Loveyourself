import app from '../../backend/app.js'

export default function handler(req, res) {
  if (!req.url.startsWith('/api/developer')) {
    req.url = `/api/developer${req.url.startsWith('/') ? req.url : `/${req.url}`}`
  }

  return app(req, res)
}
