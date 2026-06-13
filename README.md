# 138 Love Yourself

React and Vite experience with three rooms:

- Card room for letters and gentle decision prompts
- Focus room with ambient audio and an ice timer
- Sound room with a Spotify playlist

Backend lives in `backend/` and handles analytics with Express, MongoDB, and Mongoose.

## Development

```bash
npm install
npm run dev:api
npm run dev
```

The API uses MongoDB. By default it connects to
`mongodb://127.0.0.1:27017/love-yourself-analytics`.

Optional environment variables:

```bash
cp .env.example .env
```

Then fill in the values in `.env`:

```bash
MONGO_URI=mongodb://127.0.0.1:27017/love-yourself-analytics
MONGODB_DB_PATH=/opt/homebrew/var/mongodb
AUTH_SESSION_SECRET=replace-with-a-long-random-secret
ANALYTICS_ADMIN_TOKEN=change-me
PORT=5001
```

Analytics report:

```text
http://localhost:5173/#analytics
```

## Vercel Deploy

Deploy the full app to Vercel from this repo. The Vite frontend builds to `dist/`,
and `/api/*` is handled by `api/[...path].js`, which runs the Express app from
`backend/app.js`.

Set these Vercel environment variables before using analytics in production:

```bash
MONGO_URI=mongodb+srv://...
AUTH_SESSION_SECRET=your-long-random-secret
ANALYTICS_ADMIN_TOKEN=your-private-token
```

Vercel runs the backend, but MongoDB stores the analytics data. Use MongoDB Atlas
or another hosted MongoDB URL so daily and weekly reports persist after deploys.

## Checks

```bash
npm run lint
npm run build
```
