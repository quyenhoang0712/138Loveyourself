import app from '../../backend/app.js'

export default function handler(req, res) {
  if (!req.url.startsWith('/api/content-messages')) {
    req.url = `/api/content-messages${req.url.startsWith('/') ? req.url : `/${req.url}`}`
  }

  return app(req, res)
}
