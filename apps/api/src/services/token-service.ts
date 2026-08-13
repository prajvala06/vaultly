import jwt from 'jsonwebtoken';
import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string;
};

function readBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }
  return token;
}

export function readAccessTokenFromRequest(req: {
  cookies?: Record<string, string | undefined>;
  headers: { authorization?: string };
}): string | undefined {
  const cookieToken: string | undefined = req.cookies?.[env.cookieName];
  if (cookieToken) {
    return cookieToken;
  }
  return readBearerToken(req.headers.authorization);
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const expiresInSeconds: number = env.accessTokenTtlSeconds;
  return jwt.sign(payload, env.jwtAccessSecret, {
    // String form avoids jsonwebtoken rejecting non-plain Number values from env parsing.
    expiresIn: `${expiresInSeconds}s`,
  });
}

function getAccessTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: env.accessTokenTtlSeconds * 1000,
    path: '/',
    partitioned: env.cookieSameSite === 'none',
  };
}

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, getAccessTokenCookieOptions());
}

export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(env.cookieName, getAccessTokenCookieOptions());
}
