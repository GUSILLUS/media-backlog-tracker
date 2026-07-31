import express from "express";
import authRoutes from "./modules/auth/auth.routes";

// --- Why this file exists ---
// A backend "server" is just a program that stays running, listens on a port,
// and maps each incoming HTTP request to a function that returns a response.
// `express` is a thin helper that does the request-routing for us.

const app = express();

// Lets the server read JSON request bodies (we'll need this from Day 3 on).
app.use(express.json());
app.use("/auth", authRoutes);

// --- Your first endpoint ---
// A "route" = (HTTP method + path) -> handler function.
// GET /health is the standard "is the server alive?" check. Hosting platforms
// (Railway, Fly.io) ping an endpoint like this to know your app is up.
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "media-backlog", time: new Date().toISOString() });
});

// A server needs a port to listen on. We read it from the environment so the
// hosting platform can choose it in production, and fall back to 3000 locally.
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
