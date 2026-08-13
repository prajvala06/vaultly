import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http.js';
import { readAccessTokenFromRequest, type AccessTokenPayload } from '../services/token-service.js';

export type OptionallyAuthenticatedRequest = Request & {
  auth?: AccessTokenPayload;
};

export type AuthenticatedRequest = Request & {
  auth: AccessTokenPayload;
};

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token: string | undefined = readAccessTokenFromRequest(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
    (req as OptionallyAuthenticatedRequest).auth = payload;
  } catch {
    // Ignore invalid cookies on public share routes.
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token: string | undefined = readAccessTokenFromRequest(req);
  if (!token) {
    next(new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.'));
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
    (req as AuthenticatedRequest).auth = payload;
    next();
  } catch {
    next(new HttpError(401, 'UNAUTHENTICATED', 'Your session expired. Please sign in again.'));
  }
}
