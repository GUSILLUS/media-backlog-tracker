import { type CookieOptions } from "express";
import { rateLimit } from "express-rate-limit";
import { en } from "../../messages/en";

// Single source of truth for how long a session lasts.
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30D

export const AUTH_COOKIE_NAME = "session_token";

// Shared options for BOTH res.cookie() on login and res.clearCookie() on logout.
// They must match (sameSite/secure/httpOnly/path) or the browser won't clear it.
export const authCookieOptions: CookieOptions = {
  httpOnly: true,                                   
  secure: process.env.NODE_ENV === "production",    
  sameSite: "lax",                                  
  maxAge: SESSION_TTL_MS,                 
  path: "/",
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: en.TOO_MANY_REQUESTS,
})
