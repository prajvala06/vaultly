import { Router } from 'express';
import { ZodError } from 'zod';
import { HttpError, sendSuccess } from '../lib/http.js';
import {
  loginUser,
  resendRegisterOtp,
  startRegister,
  verifyRegisterOtp,
} from '../services/auth-service.js';
import { clearAccessTokenCookie, setAccessTokenCookie } from '../services/token-service.js';

export const authRouter: Router = Router();

function mapZodError(error: ZodError): HttpError {
  const firstIssue = error.issues[0];
  const message: string = firstIssue?.message ?? 'Invalid request body.';
  return new HttpError(400, 'VALIDATION_ERROR', message);
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const result = await startRegister(req.body);
    return sendSuccess(res, result, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return next(mapZodError(error));
    }
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    setAccessTokenCookie(res, result.accessToken);
    return sendSuccess(res, { user: result.user });
  } catch (error) {
    if (error instanceof ZodError) {
      return next(mapZodError(error));
    }
    return next(error);
  }
});

authRouter.post('/verify-otp', async (req, res, next) => {
  try {
    const result = await verifyRegisterOtp(req.body);
    setAccessTokenCookie(res, result.accessToken);
    return sendSuccess(res, { user: result.user });
  } catch (error) {
    if (error instanceof ZodError) {
      return next(mapZodError(error));
    }
    return next(error);
  }
});

authRouter.post('/resend-otp', async (req, res, next) => {
  try {
    const result = await resendRegisterOtp(req.body);
    return sendSuccess(res, result);
  } catch (error) {
    if (error instanceof ZodError) {
      return next(mapZodError(error));
    }
    return next(error);
  }
});

authRouter.post('/logout', (_req, res) => {
  clearAccessTokenCookie(res);
  return sendSuccess(res, { ok: true });
});
