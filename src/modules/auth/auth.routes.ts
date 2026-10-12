import express from "express";
import AuthService from "./auth.service";
import { AUTH_COOKIE_NAME, authCookieOptions, authLimiter } from "./auth.constants";
import { requireAuth } from "./auth.middleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { UserRepository } from "../../db";
import { MissingCredentialsError, UserNotFoundError } from "./auth.errors";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    if (!req.body?.email || !req.body?.password) {
      throw new MissingCredentialsError();
    }

    const user = await AuthService.registerUser(req.body);
    res.status(201).json({ user });
  }),
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    if (!req.body?.email || !req.body?.password) {
      throw new MissingCredentialsError();
    }

    const { user, sessionRawToken } = await AuthService.loginUser(req.body);

    res.cookie(AUTH_COOKIE_NAME, sessionRawToken, authCookieOptions);
    res.status(200).json({ user });
  }),
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    // clearCookie must use the same options (minus maxAge) as when it was set.
    const { maxAge, ...clearCookieOptions } = authCookieOptions;


    await AuthService.revokeSession(req.sessionId!);

    res.clearCookie(AUTH_COOKIE_NAME, clearCookieOptions);

    res.status(200).json({ ok: true });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await UserRepository.findUserById(req.userId!);

    if (!user) {
      throw new UserNotFoundError();
    }

    res.status(200).json({ user: user });
  }),
);

export default router;
