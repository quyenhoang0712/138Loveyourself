import app from '../../../backend/app.js'

export default function handler(req, res) {
  if (!req.url.startsWith('/api/tl-registrations') && !req.url.startsWith('/tl-registrations')) {
    const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id
    const queryIndex = req.url.indexOf('?')
    const search = queryIndex === -1 ? '' : req.url.slice(queryIndex)

    req.url = `/api/tl-registrations/${encodeURIComponent(id || '')}/rating${search}`
  }

  return app(req, res)
}
