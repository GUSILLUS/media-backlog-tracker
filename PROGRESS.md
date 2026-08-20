# Progress & Notes

My backend learning log for this project (frontend dev → full-stack).
Learning rule: **I write the code; Claude reviews and explains — never writes the next step.**

## Status
- [x] **Day 1** — Express + TypeScript server, `GET /health`
- [x] **Day 2** — Prisma + Postgres (Neon), schema (User / Media, enums, `@@index([userId, status])`), first migration
- [ ] **Day 3** — Auth (register + login, bcrypt, JWT) — *in progress, fixing review items below*
- [ ] **Day 4** — Auth middleware + Media CRUD
- [ ] **Day 5** — Stats aggregation + Zod validation
- [ ] **Day 6** — Frontend wiring (React + JWT + CORS)
- [ ] **Day 7** — Deploy (Railway/Fly.io) + tests + README

---

## Day 3 review — items to fix

### A. Will stop it running (must fix)
- [ ] **Env not loaded at runtime.** `dev` script doesn't load `.env`, so `DATABASE_URL` / `JWT_SECRET` are `undefined`. Fix: `tsx watch --env-file .env src/index.ts` (Node 20.19 supports `--env-file`).
- [ ] **`createUser` doesn't return/await** (`src/db.ts`). Promise is fire-and-forget → register returns `undefined` and errors escape the route's try/catch. Add `return await`.
- [ ] **Field mismatch `password` vs `passwordHash`.** In `registerUser`, `{ ...user, password: hashedPassword }` sets a field the model doesn't have. Map to `passwordHash`.

### B. Security (must fix)
- [ ] **Leaking the hash.** `register` and `login` return the full user incl. `passwordHash`. Strip it before responding.
- [ ] **Login reveals whether an email exists.** Return the *same* generic error ("Invalid credentials") for both "no user" and "wrong password" — prevents user enumeration.
- [ ] **Duplicate email not handled.** Catch Prisma `P2002` specifically → return `409 Conflict` ("Email already in use"). Don't forward raw Prisma errors to the client.

### C. Polish (can wait)
- [ ] `catch (error)` — `error` is `unknown` in strict TS; narrow with `error instanceof Error`. Also don't blindly forward internal messages to clients.
- [ ] `signToken` / `verifyToken` are `async` but `jwt.sign` / `jwt.verify` are **synchronous** — the `await` is a no-op.
- [ ] Register body is nested (`{ userPayload, password }`); flat (`{ email, password, name }`) is the conventional contract.

### What Claude praised
Repository layer (`UserRepository`) isolating DB access, clean service/route separation, correct status codes (201 / 401), single Prisma instance, `verifyToken` pre-built for Day 4.

---

## Open questions to answer (the "explain it yourself" checkpoints)
- Day 2: Why does `Media` need a `userId`, and what breaks without it? Why can a composite index `[userId, status]` also serve `userId`-only queries (leftmost-prefix rule)? Why would the DB ignore an index on `status` alone (low cardinality)?
- Day 3: Why return the *same* login error for both failure cases? What exactly did Prisma throw on duplicate email, and how do you catch it specifically? Why put only `userId` in the JWT and never the password/whole user?

## Architecture decisions made
- **ORM:** Prisma now (easiest to learn); refactor to **NestJS + TypeORM** later for UA job-market alignment.
- **Framework:** plain Express first (understand the internals), then refactor to NestJS.
- **Repo:** (revisit) monorepo with shared TS types vs. standalone — leaning simple for now.
- **Images:** store a URL/path `String?`, never the file bytes in Postgres.
