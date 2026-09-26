import { type CookieOptions } from "express";
import { rateLimit } from "express-rate-limit";
import { en } from "../../messages/en";

// Single source of truth for how long a session lasts.
// Used by signToken (jwt expiresIn = seconds) and the auth cookie (maxAge = ms).
export const TOKEN_TTL_SECONDS = 7 * 60 * 60; // 7h

export const AUTH_COOKIE_NAME = "token";

// Shared options for BOTH res.cookie() on login and res.clearCookie() on logout.
// They must match (sameSite/secure/httpOnly/path) or the browser won't clear it.
export const authCookieOptions: CookieOptions = {
  httpOnly: true,                                   
  secure: process.env.NODE_ENV === "production",    
  sameSite: "lax",                                  
  maxAge: TOKEN_TTL_SECONDS * 1000,                 
  path: "/",
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: en.TOO_MANY_REQUESTS,
})
