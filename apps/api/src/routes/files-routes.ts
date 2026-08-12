import { Readable } from 'node:stream';
import { Router } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { HttpError, sendSuccess } from '../lib/http.js';
import {
  optionalAuth,
  requireAuth,
  type AuthenticatedRequest,
  type OptionallyAuthenticatedRequest,
} from '../middleware/require-auth.js';
import {
  deleteUserFile,
  getSharedFile,
  listFilesSharedWithUser,
  listUserFiles,
  restoreUserFile,
  shareFileWithUser,
  streamSharedFileContent,
  uploadUserFile,
} from '../services/file-service.js';

export const filesRouter: Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFileSizeBytes,
    files: 1,
  },
});

function mapZodError(error: ZodError): HttpError {
  const firstIssue = error.issues[0];
  const message: string = firstIssue?.message ?? 'Invalid request body.';
  return new HttpError(400, 'VALIDATION_ERROR', message);
}

function buildContentDisposition(fileName: string, download: boolean): string {
  const disposition: string = download ? 'attachment' : 'inline';
  const safeName: string = fileName.replace(/[\r\n"]/g, '_');
  const encodedName: string = encodeURIComponent(fileName);
  return `${disposition}; filename="${safeName}"; filename*=UTF-8''${encodedName}`;
}

filesRouter.get('/shared-with-me', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await listFilesSharedWithUser(authReq.auth.sub);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

filesRouter.get('/:fileId/shared', optionalAuth, async (req, res, next) => {
  try {
    const authReq = req as OptionallyAuthenticatedRequest;
    const fileId: string = req.params.fileId ?? '';
    const result = await getSharedFile({
      fileId,
      viewerId: authReq.auth?.sub,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

filesRouter.get('/:fileId/content', optionalAuth, async (req, res, next) => {
  try {
    const authReq = req as OptionallyAuthenticatedRequest;
    const fileId: string = req.params.fileId ?? '';
    const download: boolean = req.query.download === '1' || req.query.download === 'true';
    const asset = await streamSharedFileContent({
      fileId,
      viewerId: authReq.auth?.sub,
    });
    res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', buildContentDisposition(asset.originalName, download));
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'private, max-age=60');
    const nodeStream = Readable.fromWeb(asset.body as import('node:stream/web').ReadableStream);
    nodeStream.on('error', (error) => next(error));
    nodeStream.pipe(res);
  } catch (error) {
    return next(error);
  }
});

filesRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const trashed: boolean = req.query.trashed === '1' || req.query.trashed === 'true';
    const result = await listUserFiles(authReq.auth.sub, { trashed });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

filesRouter.post('/upload', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, (uploadError: unknown) => {
    if (uploadError instanceof multer.MulterError) {
      if (uploadError.code === 'LIMIT_FILE_SIZE') {
        next(
          new HttpError(
            400,
            'FILE_TOO_LARGE',
            `File exceeds the maximum size of ${Math.round(env.maxFileSizeBytes / (1024 * 1024))} MB.`,
          ),
        );
        return;
      }
      next(new HttpError(400, 'UPLOAD_ERROR', uploadError.message));
      return;
    }
    if (uploadError) {
      next(uploadError);
      return;
    }
    void (async () => {
      try {
        const authReq = req as AuthenticatedRequest;
        if (!req.file) {
          throw new HttpError(400, 'FILE_REQUIRED', 'Choose a file to upload.');
        }
        const visibilityRaw: unknown = req.body?.visibility;
        const visibility: 'PRIVATE' | 'LINK' | 'SHARED' | 'PUBLIC' =
          visibilityRaw === 'PUBLIC'
            ? 'PUBLIC'
            : visibilityRaw === 'SHARED'
              ? 'SHARED'
              : visibilityRaw === 'LINK'
                ? 'LINK'
                : 'PRIVATE';
        const folderIdRaw: unknown = req.body?.folderId;
        const folderId: string | null =
          typeof folderIdRaw === 'string' && folderIdRaw.trim().length > 0
            ? folderIdRaw.trim()
            : null;
        const result = await uploadUserFile({
          userId: authReq.auth.sub,
          visibility,
          folderId,
          file: {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            buffer: req.file.buffer,
          },
        });
        return sendSuccess(res, result, 201);
      } catch (error) {
        if (error instanceof ZodError) {
          return next(mapZodError(error));
        }
        return next(error);
      }
    })();
  });
});

filesRouter.post('/:fileId/share', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const fileId: string = req.params.fileId ?? '';
    const email: unknown = req.body?.email;
    if (typeof email !== 'string') {
      throw new HttpError(400, 'EMAIL_REQUIRED', 'Enter an email address to share with.');
    }
    const result = await shareFileWithUser({
      ownerId: authReq.auth.sub,
      fileId,
      email,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

filesRouter.post('/:fileId/restore', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const fileId: string = req.params.fileId ?? '';
    const result = await restoreUserFile({
      userId: authReq.auth.sub,
      fileId,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

filesRouter.delete('/:fileId', requireAuth, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const fileId: string = req.params.fileId ?? '';
    const permanent: boolean = req.query.permanent === '1' || req.query.permanent === 'true';
    const result = await deleteUserFile({
      userId: authReq.auth.sub,
      fileId,
      permanent,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});
