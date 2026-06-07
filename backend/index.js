import { createApp } from './app.js'

const port = Number(process.env.PORT || 5001)
const app = createApp({ serveStatic: true })

app.listen(port, () => {
  console.log(`Analytics server listening on http://localhost:${port}`)
})
