# Media Backlog Tracker

A personal tracker for games, movies, anime, and cartoons — and my backend
learning project (frontend dev → full-stack). Node + TypeScript + Express +
PostgreSQL (Prisma), JWT auth in an httpOnly cookie.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your env file and fill in the values (see below)
cp .env.example .env

# 3. Generate the Prisma client and apply migrations to your database
npx prisma generate
npx prisma migrate dev

# 4. Run the dev server (watch mode)
npm run dev
```

Then open http://localhost:3000/health — you should see:

```json
{ "ok": true, "service": "media-backlog", "time": "..." }
```

## Environment variables

| Variable       | Required | Description                                              |
| -------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL` | yes      | Postgres connection string (Neon / Railway free tier).  |
| `JWT_SECRET`   | yes      | Secret used to sign & verify JWTs. Use a long random string. |
| `PORT`         | no       | Port to listen on (defaults to 3000; hosts set it in prod). |
| `NODE_ENV`     | no       | `production` makes the auth cookie `secure` (HTTPS-only).|

## API so far

Auth tokens are issued as an **httpOnly cookie** (`token`) on login, so the
browser sends them automatically. A `Bearer` header is also accepted (handy for
Postman / tests).

| Method | Route            | Auth | Description                          |
| ------ | ---------------- | ---- | ------------------------------------ |
| GET    | `/health`        | no   | Liveness check.                      |
| POST   | `/auth/register` | no   | Create a user. Body: `email`, `password`, `name`. |
| POST   | `/auth/login`    | no   | Log in; sets the `token` cookie.     |
| POST   | `/auth/logout`   | no   | Clears the `token` cookie.           |
| GET    | `/auth/me`       | yes  | Return the current user.             |

### Error format

All errors share one shape, produced by a central error handler. The `code` is
stable (safe to switch on / translate); `message` is human-readable text.

```json
{ "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "Invalid credentials" } }
```

## Project structure

```
src/
  errors/         # AppError base + generic HTTP error classes
  messages/       # code -> text catalogs (i18n-ready)
  middleware/     # errorHandler (central), asyncHandler (Express 4 async)
  modules/auth/   # routes, service, middleware, types, errors, constants
  db.ts           # Prisma client + repositories
  index.ts        # app setup; error handler mounted last
```

## Scripts
- `npm run dev` — run in watch mode (restarts on save)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled build

## Progress
- [x] Day 1 — server + `/health` endpoint
- [x] Day 2 — database & schema (Prisma + Postgres)
- [x] Day 3 — auth: register & login (bcrypt + JWT)
- [~] Day 4 — protected routes + item CRUD
      - [x] auth middleware (`requireAuth`) + protected `GET /auth/me`
      - [ ] `/items` CRUD scoped by user
- [ ] Day 5 — stats query + validation
- [ ] Day 6 — frontend
- [ ] Day 7 — deploy

### Extra hardening (beyond the roadmap)
- [x] JWT stored in an httpOnly cookie (+ `sameSite=lax`) instead of the response body
- [x] Centralized error handling with stable error codes (i18n-ready)
- [x] Constant-time login compare to prevent user enumeration
- [ ] Rate limiting on `/auth/login` & `/auth/register` (express-rate-limit)
