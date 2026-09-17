# Media Backlog Tracker

Personal media backlog tracker (games / movies / anime / cartoons).
Node + TypeScript, Express, Prisma, PostgreSQL (Neon), JWT auth.

## Working mode (read this first)
I am learning backend. This repo is a teaching project, not a delivery project.
Do NOT implement features for me. Default to plan mode.

- When I ask for a feature: give me the design, constraints, and terms to search.
  I write the code.
- When I paste or you read code: review it. Do not fix it unless I say "write it."
- If I say "just write it," write it, then explain what you did and why.
- Reading files, running read-only commands, and inspecting the schema: always fine.
- Editing source: only on an explicit "write it" / "implement it" from me.

Review and explanation style I want:
- Name the concept, say what breaks and when, give me the term to search.
- Don't paste corrected code unless I ask.
- Always generalize: after the repo-specific point, name the transferable shape
  and where else it applies. I want patterns I can reuse, not one-off fixes.
- Flag dead code and dead config every time. Config that nothing reads is a bug —
  it lies about what's configurable.

## Repo layout and state
- `PROGRESS.md` — day-by-day status, review items still open, architecture decisions
  and why, and the "explain it yourself" checkpoint questions.
- `ROADMAP.md` — the 7-day plan, what each day is meant to teach, and the parked
  stretch goals.
- Update either one when I ask, not automatically.

Source layout: `src/modules/<feature>/` (routes, service, middleware, errors, types),
`src/middleware/` for cross-cutting, `src/errors/AppError.ts` for the error base,
`src/messages/en.ts` for user-facing strings, `src/db.ts` for the Prisma client.
`src/generated/prisma` is generated and gitignored — never edit it, never review it.

## Commands
- `npm run dev` — dev server, watch mode, loads `.env` (tsx)
- `npm run build` — typecheck + emit to `dist/` (tsc)
- `npm start` — run the built server
- `npx prisma migrate dev --name <name>` — create + apply a migration
- `npx prisma generate` — regenerate the client (required after a fresh clone)
- `npx prisma studio` — browse the DB
- test — none yet, Day 7

## Constraints
- Never commit `.env`. `.env.example` documents the keys and must stay in sync
  with every `process.env.X` the code actually reads.
- Never edit the database by hand or hand-write SQL in `prisma/migrations/` —
  change `schema.prisma` and migrate.
- Never return the password hash (or a whole user row) in a response.

## Engineering principles
I want optimizations and best practices applied *with* the reasoning, not cargo-culted.
Before recommending any practice, say which bucket it's in:

- **Bucket A — decide now.** Expensive to reverse: baked into schema shape, the API
  contract, or needing a data migration later. Be strict about these.
- **Bucket B — measure first.** Cheap to add later, and you can't know if it's needed
  without numbers. Caching, most indexes, read replicas, denormalization. Adding these
  early buys complexity and staleness bugs for a problem I don't have yet.

Rules that follow:

- **No index, cache, or denormalization without evidence** — an `EXPLAIN ANALYZE`
  plan or a timing that shows the problem. Design indexes from the query actually
  written, not from columns that feel important.
- **Caching trades correctness for latency.** No measured latency problem = pure loss.
  When it is time: HTTP `ETag` → in-process TTL → Redis, in that order. The hard part
  is invalidation, not reads.
- **Filter at the lowest layer that can do it.** `select` only the columns needed so
  secrets never leave Postgres; scope by `userId` in the `where`, never in JS after.
- **Only the database can enforce uniqueness atomically.** Attempt-and-catch the
  constraint violation; never check-then-act (that's a TOCTOU race and an extra round trip).
- **Allowlist, never denylist** — CORS origins, redirect URLs, upload types. You can't
  enumerate bad.
- **Cost-proportional limits.** The more a route costs to serve, the tighter its rate
  limit. bcrypt and external-API calls are expensive; `/health` isn't.
- **Middleware order is a pipeline.** Anything that must appear on *every* response,
  including errors (CORS headers), goes early. The error handler goes last.
- **Per-instance state doesn't survive horizontal scaling.** In-memory caches, rate-limit
  counters, and sessions all silently break at two instances. Know which ones I'm relying on.
- **Drain, then close.** On SIGTERM: stop advertising readiness → stop accepting new work →
  finish in-flight → disconnect resources → exit, with a backstop timer shorter than the
  platform's kill timeout. Same shape for queues, websockets, and timers.
- **Watch for N+1**, which in Prisma comes from `await` inside a loop — not from
  `include`/`select`. Turn on query logging in dev to count queries per request.
- **A retried non-idempotent write creates duplicates.** If a client can't tell whether
  a POST committed, that's a design problem, not a network problem.

## Architecture conventions
The patterns this repo commits to. Enforce them in review; flag violations even when
I didn't ask. The payoff is the planned NestJS refactor: Nest *is* this layering with
decorators on top, so keeping the seams clean makes that a file move, not a rewrite.

- **Layered: route → service → repository.** Each layer may only call the one below.
  - Routes own HTTP only: read `req`, pick a status code, shape the response.
  - Services own business logic and must never touch `req`/`res` or import express types.
  - Repositories own all data access. No `prisma.` call anywhere outside `src/db.ts`.
  - Test of whether it's right: could this service run from a CLI or a queue worker,
    with no HTTP involved? If not, HTTP has leaked downward.
- **Module per feature**, not layer per type. New feature = new folder under
  `src/modules/<feature>/` holding its own routes/service/errors/types.
- **Dependencies point inward.** Inner layers never import from outer ones. A service
  importing from `middleware/` or `routes/` is the smell.
- **Services throw domain errors; only the error handler knows HTTP.** Extend `AppError`,
  throw things like `EmailInUseError`, and let one central handler map them to status
  codes and to `messages/en.ts` strings. Never `res.status(409)` inside a service.
- **Validate at the boundary, then trust inward.** Parse the request body into a typed
  DTO at the route edge (Zod, Day 5) and pass the parsed object down. Services should
  not re-check shapes; if they must, the boundary is in the wrong place.
- **Cross-cutting concerns are middleware, not copy-paste.** Auth, async error catching,
  rate limiting, logging, request IDs. If the same three lines open every handler, it's
  middleware.
- **Config is parsed and validated once at startup**, exported as a typed object.
  No `process.env.X!` scattered through the code — a missing secret should crash at boot
  with a clear message, not 401 on the first login hours later.
- **Never fire-and-forget a promise.** Always `await` or attach an explicit `.catch`.
  An unhandled rejection takes the whole process down and the stack trace won't point
  at the call site.
- **Log structured JSON to stdout**, never `console.log` with string concatenation, and
  never log secrets, tokens, or password hashes. The platform collects stdout; that's
  the whole logging setup.
- **Keep the process stateless.** No in-memory session/user state. Anything that must
  survive a restart or be shared across instances belongs in Postgres (or later Redis).

## Decisions still open (raise these before I write the code)
- **Pagination style for `GET /items`** — offset vs keyset/cursor. Bucket A: the response
  shape is a contract the frontend depends on. Raise before Day 4.
- **Cookie `sameSite` + hosting layout** — `lax` works locally but not cross-site in prod
  (separate frontend/API domains), which would force `none` + `secure` + CSRF tokens.
  Raise before Day 6.
