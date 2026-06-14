import app from '../backend/app.js'

export default function handler(req, res) {
  if (!req.url.startsWith('/api') && !req.url.startsWith('/health')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`
  }

  return app(req, res)
}
