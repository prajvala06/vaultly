import jwt from 'jsonwebtoken';
import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtlSeconds,
  });
}

function getAccessTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: env.accessTokenTtlSeconds * 1000,
    path: '/',
  };
}

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, getAccessTokenCookieOptions());
}

export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(env.cookieName, getAccessTokenCookieOptions());
}
