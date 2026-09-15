import { type RequestHandler } from "express";

// Express 4 does NOT forward errors thrown in async handlers to the error
// middleware. This wrapper catches a rejected promise and calls next(err),
// so route handlers can just `throw`. (Express 5 makes this unnecessary.)
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
