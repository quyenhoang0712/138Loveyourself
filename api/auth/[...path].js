import app from '../../backend/app.js'

export default function handler(req, res) {
  if (!req.url.startsWith('/api/auth') && !req.url.startsWith('/auth')) {
    req.url = `/api/auth${req.url.startsWith('/') ? req.url : `/${req.url}`}`
  }

  return app(req, res)
}
