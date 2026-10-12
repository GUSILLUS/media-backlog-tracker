import { type Request, type Response, type NextFunction } from "express";
import AuthService from "./auth.service";
import { AUTH_COOKIE_NAME } from "./auth.constants";
import { UnauthenticatedError, InvalidSessionError } from "./auth.errors";

const { verifySession } = AuthService;

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.cookies?.[AUTH_COOKIE_NAME];

    if (!sessionToken) {
      throw new UnauthenticatedError();
    }

    const session = await verifySession(sessionToken);

    if (!session || !session.userId) {
      throw new InvalidSessionError();
    }

    req.userId = session.userId;
    next();
  } catch (err) {
    next(err); // hand off to the central error handler
  }
};
