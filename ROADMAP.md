# Backend in a Week — Media Backlog Tracker (frontend → full-stack)

Your first complete full-stack app: sign up, add things you want to watch/play
(games, movies, anime, cartoons), track their status and rating, and see a dashboard
that summarizes your collection — deployed to a live URL. The **frontend is your
comfort zone; the backend is the lesson.**

**Honest expectation:** one week = your first real full-stack app + the core
concepts. Not "job-ready" yet — but do 2–3 apps like this and you are.

**Stack (reuses your TypeScript):**
Node + TypeScript, **Express** (learn the "why" before frameworks like NestJS),
**PostgreSQL** (free hosted: Neon or Railway), **Prisma** as the ORM, **JWT** for
auth. Frontend: whatever React setup you're fastest in — keep it minimal.

> **Plan changed during Day 4 (2026-10-12):** auth pivoted from stateless JWT to
> **opaque server-side sessions** (a `Session` table + an httpOnly cookie holding a
> random handle, SHA-256 at rest). Reason: a JWT can't be revoked, so "log out" and
> "log out everywhere" are not implementable without server state. Everything below
> that says "JWT" should be read as "session cookie". The JWT detour was not wasted —
> see the checkpoint questions in PROGRESS.md.

**The data model in one line:** a `User` has many `MediaItem`s; each item has a
**category** (GAME / MOVIE / ANIME / CARTOON), a **status** (PLANNING / IN_PROGRESS /
COMPLETED / DROPPED), and a rating. That's all you need to hit every backend concept.

**The learning rule:** each day, write it yourself, get it working, then ask Claude
to *review and explain* — not to write tomorrow. If you can explain the day's concept
in your own words, you learned it.

---

## Day 1 — Server + first endpoint
Set up Express + TypeScript. One route: `GET /health` returns `{ ok: true }`.
Get a Postgres database running (Neon free tier is easiest — no local install).

**Understand:** what a server actually is (listens on a port, maps requests to handler
functions), and the request → handler → response cycle. What a connection string is.

## Day 2 — Database & schema
Add Prisma. Define models: `User` and `MediaItem`
(title, category enum, status enum, rating, notes, userId, createdAt).
Run your first migration. Seed a few items and read them back.

**Understand:** tables, columns, **enums**, and the **relationship** (an item belongs
to a user). What a migration is and why you never edit the DB by hand.

## Day 3 — Auth part 1: registration & login
`POST /auth/register` and `POST /auth/login`. Hash passwords with **bcrypt** (never
store plaintext). On login, issue a **JWT**.

**Understand:** why passwords are hashed, not encrypted; what a JWT is (a signed token,
not a secret store) and what's safe to put in it. The #1 interview topic.

## Day 4 — Auth part 2: protected routes + CRUD
Write **auth middleware** that reads the JWT and rejects requests without a valid one.
Add `POST /items`, `GET /items` (with filtering by category & status), `PATCH /items/:id`
(update status/rating), `DELETE /items/:id` — all scoped so a user only sees their own items.

**Understand:** middleware and the request pipeline; **authorization** (this user can only
touch their data) vs. authentication (who they are). Why filtering by `userId` on the
server matters even if the frontend "hides" other data.

## Day 5 — Real queries + validation
Add `GET /stats`: counts per category, counts per status, and average rating
(a real **aggregation query** — GROUP BY / COUNT / AVG). Validate all inputs with **Zod**.
Add consistent error handling (proper status codes, no stack traces leaked).

**Understand:** how to ask the database a real question, why you validate on the server
even though the frontend validates too, and what each HTTP status code means.

## Day 6 — Wire up the frontend
Minimal React UI: login screen, a grid of your items with category/status filters, a form
to add one, and a small dashboard (e.g. a bar chart of items per category). Store the JWT,
send it on requests.

**Understand:** how the token travels (Authorization header), CORS, and why the browser
and server are two separate trust boundaries.

## Day 7 — Deploy + polish
Deploy backend + DB to **Railway** (or Fly.io). Set environment variables/secrets properly
(never commit them). Write a short README with setup steps. Add 2–3 integration tests for
the auth + create-item flow.

**Understand:** environment config and secrets, what "it works on my machine" hides, and
why tests + a README are what make a repo look hireable.

---

## Nice stretch goals (only after the 7 days)
- Pull cover art / metadata from a free API when you add an item (TMDb for movies,
  RAWG for games, Jikan/AniList for anime) — teaches consuming + caching an external API.
- "Currently in progress" quick view; sort by rating.
- Refactor the whole thing to **NestJS** — same features, real-world backend structure.

## The path to actually applying
Finish this → build one more, different-shaped project (real-time, or heavy external-API) →
learn the theory these touch (HTTP, REST, SQL & indexes, auth, caching, OWASP basics) well
enough to explain in an interview. Three deployed projects + being able to explain them =
ready to apply for full-stack roles.
