import { type ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";
import { en } from "../messages/en";

// The SINGLE place that turns a thrown error into an HTTP response.
// Must have 4 args and be registered LAST (after all routes) in index.ts.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const message = en[err.code] ?? en.INTERNAL;
    res.status(err.statusCode).json({
      error: { code: err.code, message, details: err.details },
    });
    return;
  }

  // Anything not an AppError is unexpected: log the real thing, hide details.
  console.error("[unhandled error]", err);
  res.status(500).json({ error: { code: "INTERNAL", message: en.INTERNAL } });
};
