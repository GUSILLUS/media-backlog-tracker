import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "media-backlog", time: new Date().toISOString() });
});

// Error handler goes LAST, after every route, so thrown errors funnel here.
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
