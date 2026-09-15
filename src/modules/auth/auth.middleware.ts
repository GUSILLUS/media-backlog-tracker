import { type Request, type Response, type NextFunction } from "express";
import AuthService from "./auth.service";
import { AUTH_COOKIE_NAME } from "./auth.constants";
import { UnauthenticatedError, InvalidTokenError } from "./auth.errors";

const { verifyToken } = AuthService;

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new UnauthenticatedError();
    }

    const decoded = await verifyToken(token);

    if (!decoded.id || typeof decoded.id !== "string") {
      throw new InvalidTokenError();
    }

    req.userId = decoded.id;
    next();
  } catch (err) {
    next(err); // hand off to the central error handler
  }
};
