import jwt from 'jsonwebtoken';
import type { Response } from 'express';
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

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    maxAge: env.accessTokenTtlSeconds * 1000,
    path: '/',
  });
}

export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    path: '/',
  });
}
