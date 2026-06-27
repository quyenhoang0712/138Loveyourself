import app from '../../backend/app.js'

export default function handler(req, res) {
  if (!req.url.startsWith('/api/tl-registrations') && !req.url.startsWith('/tl-registrations')) {
    req.url = `/api/tl-registrations${req.url.startsWith('/') ? req.url : `/${req.url}`}`
  }

  return app(req, res)
}
