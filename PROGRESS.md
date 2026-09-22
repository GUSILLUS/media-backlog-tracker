# Progress & Notes

My backend learning log for this project (frontend dev → full-stack).
Learning rule: **I write the code; Claude reviews and explains — never writes the next step.**

## Status
- [x] **Day 1** — Express + TypeScript server, `GET /health`
- [x] **Day 2** — Prisma + Postgres (Neon), schema (User / Media, enums, `@@index([userId, status, favorite])`), first migration
- [x] **Day 3** — Auth (register + login, bcrypt, JWT, httpOnly cookie) — **working**; hardening + pivot below
- [ ] **Day 4** — Auth middleware **[done: `requireAuth` + `/me`]** · Media CRUD **[todo]**
- [ ] **Day 5** — Stats aggregation + Zod validation
- [ ] **Day 6** — Frontend wiring (React + JWT/cookies + CORS)
- [ ] **Day 7** — Deploy (Railway/Fly.io) + tests + README

---

## Auth — current state (2026-09-22)

**Working now (committed):** register + login + logout + `/me`, bcrypt hashing,
JWT in an httpOnly cookie (7h), `requireAuth` middleware, central error handler,
repository layer (`UserRepository`), `secureUser` strips the hash, same generic
login error + `DUMMY_PASSWORD_HASH` timing defense, flat request body.

All of the *original* Day-3 review items are done (env loading, repo `await`,
hash leak, user enumeration, nested body).

### Decided direction — pivot auth to server-side sessions
Switching from stateless JWT to **opaque server-side sessions**. Why: instant
revocation + real "log out all devices", and it's *less* code than JWT
access/refresh rotation. The trade I'm accepting: a **DB lookup per request**
(hot path is no longer stateless) in exchange for simplicity + revocability.
- Cookie holds an opaque random id (`crypto.randomBytes`), **not** a JWT.
- Store **SHA-256(id)** in a `Session` table, never the raw id (DB leak = live logins).
- `Session`: `tokenHash @unique`, `userId`, `expiresAt`, `createdAt`, optional
  `lastUsedAt`/`userAgent`/`ip`; `@@index([userId])` for logout-all.
- Removes the JWT code + `JWT_SECRET` need. (Optional `COOKIE_SECRET` only if I sign cookies.)
- Expiry: start **absolute**; add throttled sliding only if UX needs it (avoid a write per request).
- Search: *server-side sessions, session fixation, token hashing at rest, sliding session expiration*.

### Open work items (still valid regardless of session pivot)
- [ ] **Duplicate email is check-then-act (TOCTOU).** `registerUser` does
  `findUserByEmail` → throw, then `create`. Concurrent registers race; only the
  DB `@unique` stops the second, surfacing as a raw 500. Fix: drop the pre-check,
  wrap `create`, map Prisma **P2002** → `EmailInUseError` (409). `isEmailUsed`
  becomes dead code. → CLAUDE.md "only the DB enforces uniqueness atomically".
- [ ] **Config not validated at startup.** `process.env.X!` used inline. A missing
  secret should crash at boot, not on first request. Fix: one `config.ts` that
  reads + validates env once, exports a typed object. Keep `.env.example` in sync.
- [ ] Boundary validation still manual (`req.body?.email`) — replaced by a Zod DTO on Day 5.

### Planned — rate limiter (tiered)
`express-rate-limit@8.7.0` is **installed but imported nowhere** (dead dep). `cors@2.8.6` too.
- **Loose global** limiter (IP-keyed, mounted early, `/health` excluded) — blanket backstop.
- **Tight auth** limiter stacked on `/auth/login` + `/auth/register` (bcrypt = expensive + abuse target).
- One global number can't do both jobs — cost per route differs ~1000× (cost-proportional limits).
- Caveats: default store is **in-memory / per-instance** (breaks at 2+ instances → Redis later);
  set `trust proxy` before deploy or the key is the proxy's IP; app limiter ≠ DDoS protection (that's the edge).
- Search: *tiered rate limiting, rate-limit key selection, distributed rate limiting, trust proxy*.

---

## Open questions to answer (the "explain it yourself" checkpoints)
- Day 2: Why does `Media` need a `userId`, and what breaks without it? Why can a composite index `[userId, status]` also serve `userId`-only queries (leftmost-prefix rule)? Why would the DB ignore an index on `status` alone (low cardinality)?
- Day 3: Why return the *same* login error for both failure cases? What exactly does Prisma throw on duplicate email, and how do you catch it specifically? Why put only `userId` in a token and never the password/whole user?
- Sessions: Why does a stateless JWT make logout impossible to enforce? Why hash the session id at rest? What does a per-request lookup buy you, and what does it cost?

## Architecture decisions made
- **Auth:** pivoting stateless JWT → **server-side sessions** (revocation + simplicity over a stateless hot path).
- **Rate limiting:** tiered — loose global + tight on the bcrypt routes.
- **ORM:** Prisma now (easiest to learn); refactor to **NestJS + TypeORM** later for UA job-market alignment.
- **Framework:** plain Express first (understand the internals), then refactor to NestJS.
- **Repo:** (revisit) monorepo with shared TS types vs. standalone — leaning simple for now.
- **Images:** store a URL/path `String?`, never the file bytes in Postgres.
