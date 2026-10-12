# Progress & Notes

My backend learning log for this project (frontend dev → full-stack).
Learning rule: **I write the code; Claude reviews and explains — never writes the next step.**

## Status
- [x] **Day 1** — Express + TypeScript server, `GET /health`
- [x] **Day 2** — Prisma + Postgres (Neon), schema (User / Media, enums, `@@index([userId, status, favorite])`), first migration
- [x] **Day 3** — Auth (register + login, bcrypt, httpOnly cookie) — **working**
- [ ] **Day 4** — Auth middleware **[done: `requireAuth` + `/me`]** · JWT → session pivot **[in progress]** · Media CRUD **[todo]**
- [ ] **Day 5** — Stats aggregation + Zod validation
- [ ] **Day 6** — Frontend wiring (React + cookies + CORS)
- [ ] **Day 7** — Deploy (Railway/Fly.io) + tests + README

---

## Auth — current state (2026-10-12)

**The JWT → server-side session pivot is implemented but NOT finished.** It compiles
(`npx tsc --noEmit` is clean) and the login path works end to end. Register and logout
each have a blocking bug — read those before running anything against a real DB.

### What exists now
- `Session` table + migration `20261004133357_auth_session_and_refactor`:
  `tokenHash @unique`, `userId` FK `onDelete: Cascade`, `expiresAt`/`createdAt` as
  `@db.Timestamptz(3)`, `@@index([userId])`. `Media.user` also gained `onDelete: Cascade`.
- `session.crypto.ts` — `generateSessionToken()` (32 random bytes → base64url) and
  `hashSessionToken()` (SHA-256). No parameters and no configurable algorithm on purpose:
  one producer of tokens, one producer of hashes, so the two paths cannot drift.
- `SessionRepository` in `db.ts` — create / find-valid-by-hash / find-all-by-user /
  delete-by-id / delete-all-by-user / delete-expired.
- `AuthService` — `verifySession`, `revokeSession`, `loginUser` (issues a session),
  `registerUser`.
- `requireAuth` reads the cookie only; the `Authorization: Bearer` fallback was removed
  (two entrances = two threat models, and nothing used it).
- `POST /auth/logout` is behind `requireAuth` and calls `revokeSession`.
- Per-use-case `select` objects in `src/types/{user,session}.ts` via
  `satisfies Prisma.XSelect`, with the output DTO derived from the same const so the
  query shape and the type can't disagree.

### Blocking bugs — fix these first next session
1. **Register returns the password hash.** `createUser` has no `select`, `registerUser`
   returns the raw row, and the route serialises it. Breaks the hard rule in CLAUDE.md.
   Fix: `select: userSelect` on `createUser`, so the hash never leaves Postgres at all.
2. **`req.sessionId` is declared but never assigned.** `express.d.ts` has the field;
   `requireAuth` only sets `req.userId`. Logout therefore calls `revokeSession(undefined!)`.
3. **`deleteSessionById` deletes more than the one session.** Its `where` is
   `OR: [{ id }, { expiresAt: { lt: now } }]`, so it also sweeps every expired row in the
   table — and combined with bug 2 the `id` branch collapses, so logout can delete rows
   belonging to other users. Keep "revoke this one" separate from "sweep expired";
   the sweep already exists as `deleteExpiredSessions`.
4. **`registerUser`'s catch swallows everything that isn't P2002** and then falls off the
   end returning `undefined`, so a DB failure answers `201 { user: undefined }`.
   Catch only P2002 → `EmailInUseError`; let everything else reach the error handler as 500.

### Smaller open items
- `verifySession` is typed `Promise<SessionOutput | null>` but never returns null. The
  `if (!session || ...)` branch in `requireAuth` exists only because the type lies.
- `SessionCreationError` / `SessionRevocationError` are unreachable — `prisma.create`
  throws rather than returning a falsy value.
- Unused import `UserModel` in `auth.service.ts`.
- `userSelect` omits `avatarUrl`, so `/me` can't return one.
- **JWT teardown not done:** `jsonwebtoken` + `@types/jsonwebtoken` are still dependencies
  and `JWT_SECRET` is still in `.env.example`, but no code reads it any more. Config that
  nothing reads lies about what's configurable.
- **Config still not validated at startup** — `process.env.X` read inline. One `config.ts`
  that parses + validates once and exports a typed object. Easier now: with `JWT_SECRET`
  gone, `DATABASE_URL` is nearly the only required secret.
- Boundary validation still manual (`req.body?.email`) — Zod DTO on Day 5.
- `express-rate-limit` v7+ renamed `max` → `limit`; `max` still works but is deprecated.

### Session design decisions (and why)
- **Opaque handle in the cookie, SHA-256 of it in the DB.** The cookie carries the raw
  32-byte value; `tokenHash` stores its digest. A DB dump yields no live logins, because
  the stored value is not the presented value.
- **SHA-256, not bcrypt, and no pepper.** The input is 256 bits of CSPRNG output: nothing
  to brute-force, and no enumerable input space that a secret key would protect. bcrypt is
  salted → non-deterministic → the row couldn't be found by index at all.
- **Three distinct values:** raw handle (secret, cookie only), `tokenHash` (verifier, DB
  only), `Session.id` (stable identifier — safe to log, to return, and to revoke by).
- **TTL = 7 days, absolute.** Revocation now exists, so the short-TTL pressure that
  justifies 15-minute JWTs is gone. One constant (`SESSION_TTL_MS`) feeds both `expiresAt`
  and the cookie's `maxAge`.
- **`maxAge` must be absent from `clearCookie`.** Express 4 merges it over the epoch expiry
  and re-sets the cookie for another 7 days instead of deleting it (Express 5 ignores it).
  The clear call gets base options only; login spreads base + `maxAge`.
- **Cookie `path: "/"`, no `domain`.** Identity attributes (name + path + domain) must match
  between set and clear or you get two same-named cookies. `path` limits transmission, not
  access — it is not a security boundary. Omitting `domain` gives a host-only cookie, which
  is the stricter default.
- **No `lastUsedAt` yet.** Idle timeout is Bucket B, and a nullable column is cheap to add
  later — unlike the `Timestamptz` choice, which was decided up front because changing a
  column type means casting live rows.
- **No sweeper scheduled.** `deleteExpiredSessions` exists; nothing calls it. One row per
  login isn't a problem worth a timer yet. An in-process `setInterval` would be
  per-instance state and wouldn't survive scaling.

### Rate limiter — current state
`authLimiter` (15 min / 5 requests) is mounted on `/auth/register` and `/auth/login`.
Still to do: a loose global limiter mounted early with `/health` excluded. One number can't
serve both — cost per route differs by ~1000× (bcrypt vs. a static JSON response).
Caveats: the default store is in-memory and per-instance (breaks at 2+ instances → Redis
later); `trust proxy` must be set before deploy or the key is the proxy's IP; an app-level
limiter is not DDoS protection (that's the edge).
Search: *tiered rate limiting, rate-limit key selection, distributed rate limiting, trust proxy*.

---

## Open questions to answer (the "explain it yourself" checkpoints)
- Day 2: Why does `Media` need a `userId`, and what breaks without it? Why can a composite index `[userId, status]` also serve `userId`-only queries (leftmost-prefix rule)? Why would the DB ignore an index on `status` alone (low cardinality)?
- Day 3: Why return the *same* login error for both failure cases? What exactly does Prisma throw on duplicate email, and how do you catch it specifically?
- Sessions: Why does a stateless JWT make logout impossible to enforce? Why hash the session id at rest? What does a per-request lookup buy you, and what does it cost?
- Sessions: Why can't bcrypt be used to store a session handle, even though it's "stronger"?
- Sessions: What does `clearCookie` on logout accomplish, and what does it fail to accomplish?
- Sessions: The hot path is now one DB round trip per request. At what measured number would caching be justified, and what breaks the moment it's added?
- Types: Why is `Pick`/`select` an allowlist while `Omit`/`omit` is a denylist, and why does that distinction get more dangerous as the schema grows?

## Architecture decisions made
- **Auth:** stateless JWT → **server-side sessions** — instant revocation and a real "log out everywhere", paid for with a DB lookup per request. Implemented, not yet finished.
- **Rate limiting:** tiered — loose global + tight on the bcrypt routes.
- **ORM:** Prisma now (easiest to learn); refactor to **NestJS + TypeORM** later for UA job-market alignment.
- **Framework:** plain Express first (understand the internals), then refactor to NestJS.
- **Repo:** (revisit) monorepo with shared TS types vs. standalone — leaning simple for now.
- **Images:** store a URL/path `String?`, never the file bytes in Postgres.
- **Branded types:** deferred. `Pick` + object params closed the argument-order hole; revisit when `userId` threads through Media routes/services/repos. Half a brand reads like a guarantee and isn't.

## Still open — raise before writing the code
- **Pagination style for `GET /items`** — offset vs keyset/cursor. Bucket A: the response shape is a frontend contract. Raise before Media CRUD.
- **Cookie `sameSite` + hosting layout** — `lax` works locally but not cross-site in prod (separate frontend/API domains), which forces `none` + `secure` + CSRF tokens. Raise before Day 6.
