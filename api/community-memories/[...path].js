import app from '../../backend/app.js'

export default function handler(req, res) {
  if (!req.url.startsWith('/api/community-memories')) {
    req.url = `/api/community-memories${req.url.startsWith('/') ? req.url : `/${req.url}`}`
  }

  return app(req, res)
}
