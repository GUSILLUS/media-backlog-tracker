// Code -> human text. This is the ONE place UI copy lives.
// For a second language, add src/messages/uk.ts with the same keys and pick
// the catalog by request locale in the error handler.
export const en: Record<string, string> = {
  // auth
  AUTH_MISSING_CREDENTIALS: "Email and password are required",
  AUTH_INVALID_CREDENTIALS: "Invalid credentials",
  AUTH_EMAIL_IN_USE: "Email is already in use",
  AUTH_USER_NOT_FOUND: "User not found",
  AUTH_UNAUTHENTICATED: "You must be signed in",
  AUTH_INVALID_TOKEN: "Invalid or expired token",

  // generic fallbacks
  BAD_REQUEST: "Bad request",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not found",
  CONFLICT: "Conflict",
  INTERNAL: "Something went wrong",
  TOO_MANY_REQUESTS: "Too many requests from this IP, please try again after 15 minutes",
};
