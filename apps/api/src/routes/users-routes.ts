import { Router } from 'express';
import { HttpError, sendSuccess } from '../lib/http.js';
import { requireAuth } from '../middleware/require-auth.js';
import { lookupUserByEmail } from '../services/user-service.js';

export const usersRouter: Router = Router();

usersRouter.get('/lookup', requireAuth, async (req, res, next) => {
  try {
    const email: unknown = req.query.email;
    if (typeof email !== 'string' || email.trim().length === 0) {
      throw new HttpError(400, 'EMAIL_REQUIRED', 'Enter an email address to search.');
    }
    const result = await lookupUserByEmail({ email });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});
