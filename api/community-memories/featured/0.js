import app from '../../../backend/app.js'

export default function handler(req, res) {
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  req.url = `/api/community-memories/featured/0${query}`
  return app(req, res)
}
