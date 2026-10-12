import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/AppError";

// Auth-specific errors. Each just fixes a stable code + inherits the status.
// Throw these from the service/middleware; never build a response here.
export class MissingCredentialsError extends BadRequestError {
  constructor() {
    super("AUTH_MISSING_CREDENTIALS");
  }
}
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super("AUTH_INVALID_CREDENTIALS");
  }
}
export class EmailInUseError extends ConflictError {
  constructor() {
    super("AUTH_EMAIL_IN_USE");
  }
}
export class UserNotFoundError extends NotFoundError {
  constructor() {
    super("AUTH_USER_NOT_FOUND");
  }
}
export class UnauthenticatedError extends UnauthorizedError {
  constructor() {
    super("AUTH_UNAUTHENTICATED");
  }
}
export class InvalidSessionError extends UnauthorizedError {
  constructor() {
    super("AUTH_INVALID_SESSION");
  }
}

export class SessionCreationError extends UnauthorizedError {
  constructor() {
    super("AUTH_SESSION_CREATION_FAILED");
  }
}

export class SessionRevocationError extends NotFoundError {
  constructor() {
    super("AUTH_SESSION_REVOCATION_FAILED");
  }
}
