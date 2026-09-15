// Base class for every *expected* error in the app.
// Carries a stable `code` (never shown to users, safe to switch on) and the
// HTTP `statusCode`. The human-readable text is resolved later, in the error
// handler, from a per-language message catalog keyed by `code`.
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message?: string,            // dev-facing note for logs, NOT the UI text
    public readonly details?: unknown,
  ) {
    super(message ?? code);
    this.name = new.target.name; // subclass name, e.g. "InvalidCredentialsError"
    Error.captureStackTrace?.(this, new.target);
  }
}

// Generic HTTP-shaped errors. Feature modules extend these with concrete codes.
export class BadRequestError extends AppError {
  constructor(code = "BAD_REQUEST", details?: unknown) {
    super(code, 400, undefined, details);
  }
}
export class UnauthorizedError extends AppError {
  constructor(code = "UNAUTHORIZED") {
    super(code, 401);
  }
}
export class ForbiddenError extends AppError {
  constructor(code = "FORBIDDEN") {
    super(code, 403);
  }
}
export class NotFoundError extends AppError {
  constructor(code = "NOT_FOUND") {
    super(code, 404);
  }
}
export class ConflictError extends AppError {
  constructor(code = "CONFLICT") {
    super(code, 409);
  }
}
