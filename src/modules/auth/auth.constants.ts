import { type CookieOptions } from "express";

// Single source of truth for how long a session lasts.
// Used by signToken (jwt expiresIn = seconds) and the auth cookie (maxAge = ms).
export const TOKEN_TTL_SECONDS = 7 * 60 * 60; // 7h

export const AUTH_COOKIE_NAME = "token";

// Shared options for BOTH res.cookie() on login and res.clearCookie() on logout.
// They must match (sameSite/secure/httpOnly/path) or the browser won't clear it.
export const authCookieOptions: CookieOptions = {
  httpOnly: true,                                   // JS can't read it -> XSS can't steal the token
  secure: process.env.NODE_ENV === "production",    // HTTPS-only in prod, allows http in local dev
  sameSite: "lax",                                  // main CSRF mitigation for cookie-based auth
  maxAge: TOKEN_TTL_SECONDS * 1000,                 // ms; kept in sync with the JWT expiry
  path: "/",
};
