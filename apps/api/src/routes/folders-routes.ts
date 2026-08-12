import { Router } from 'express';
import { HttpError, sendSuccess } from '../lib/http.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/require-auth.js';
import { createUserFolder, listUserFolders } from '../services/folder-service.js';

export const foldersRouter: Router = Router();

foldersRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await listUserFolders(authReq.auth.sub);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

foldersRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const name: unknown = req.body?.name;
    if (typeof name !== 'string') {
      throw new HttpError(400, 'FOLDER_NAME_REQUIRED', 'Enter a folder name.');
    }
    const result = await createUserFolder({
      userId: authReq.auth.sub,
      name,
    });
    return sendSuccess(res, result, 201);
  } catch (error) {
    return next(error);
  }
});
