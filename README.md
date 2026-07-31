# Media Backlog Tracker

A personal tracker for games, movies, anime, and cartoons — and my backend
learning project (frontend dev → full-stack).

## Run it (Day 1)

```bash
npm install
npm run dev
```

Then open http://localhost:3000/health — you should see:

```json
{ "ok": true, "service": "media-backlog", "time": "..." }
```

## Scripts
- `npm run dev` — run in watch mode (restarts on save)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled build

## Progress
- [x] Day 1 — server + `/health` endpoint
- [ ] Day 2 — database & schema (Prisma + Postgres)
- [ ] Day 3 — auth: register & login
- [ ] Day 4 — protected routes + item CRUD
- [ ] Day 5 — stats query + validation
- [ ] Day 6 — frontend
- [ ] Day 7 — deploy
